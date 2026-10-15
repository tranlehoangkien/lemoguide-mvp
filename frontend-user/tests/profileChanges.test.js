import test, { beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { isProfileMutation, notifyProfileChanged, subscribeProfileChanges } from '../src/services/profileChanges.js';
import { apiRequest, STORAGE_KEY } from '../src/services/apiClient.js';

const originals = new Map();
class TestChannel {
  static channels = new Set();
  constructor(name) { this.name = name; TestChannel.channels.add(this); }
  postMessage(data) {
    for (const channel of TestChannel.channels) {
      if (channel !== this && channel.name === this.name) channel.onmessage?.({ data });
    }
  }
  close() { TestChannel.channels.delete(this); }
}
beforeEach(() => {
  for (const key of ['window', 'sessionStorage', 'localStorage', 'BroadcastChannel', 'fetch']) originals.set(key, globalThis[key]);
  globalThis.window = new EventTarget();
  window.location = { pathname: '/profile' };
  const session = new Map([[STORAGE_KEY, JSON.stringify({ id: 7, token: 'real-token' })]]);
  globalThis.sessionStorage = { getItem: key => session.get(key), removeItem: key => session.delete(key) };
  globalThis.localStorage = { removeItem() {} };
  globalThis.BroadcastChannel = TestChannel;
});
afterEach(() => {
  TestChannel.channels.clear();
  for (const [key, value] of originals) {
    if (value === undefined) delete globalThis[key]; else globalThis[key] = value;
  }
});

test('refreshes profile writes and excludes reads, extraction previews and AI generation', () => {
  for (const path of ['/api/me', '/api/me/avatar', '/api/me/skills/1', '/api/me/profile-import/apply',
    '/api/me/workspace/tasks/2', '/api/me/career-plans/3/tasks/4', '/api/me/discovery/attempts/5/answers']) {
    assert.equal(isProfileMutation(path, 'PATCH'), true, path);
    assert.equal(isProfileMutation(path, 'GET'), false, path);
  }
  for (const path of ['/api/me/profile-import/extract', '/api/me/career-plans/proposals',
    '/api/me/workspace/applications', '/api/ai/chat', '/api/me/profile-progress']) {
    assert.equal(isProfileMutation(path, 'POST'), false, path);
  }
});

test('local and cross-tab notifications isolate accounts, avoid echoes and release listeners', () => {
  let mine = 0, other = 0;
  const unsubscribe = subscribeProfileChanges(7, () => mine++);
  const unsubscribeOther = subscribeProfileChanges(8, () => other++);
  notifyProfileChanged(7);
  assert.equal(mine, 1);
  assert.equal(other, 0);
  const remote = new TestChannel('lemoguide-profile');
  remote.postMessage({ accountId: '7', source: 'another-tab' });
  assert.equal(mine, 2);
  remote.postMessage({ accountId: '8', source: 'another-account' });
  assert.equal(mine, 2);
  assert.equal(other, 1);
  unsubscribe(); unsubscribeOther(); remote.close();
  notifyProfileChanged(7);
  assert.equal(mine, 2);
  assert.equal(TestChannel.channels.size, 0);
});

test('API announces only successful persisted changes and completed assessments', async () => {
  let refreshed = 0;
  const unsubscribe = subscribeProfileChanges(7, () => refreshed++);
  const respond = (body, status = 200) => { globalThis.fetch = async () => new Response(JSON.stringify(body), { status }); };
  respond({ success: true, data: {} });
  await apiRequest('/api/me/profile-import/extract', { method: 'POST' });
  await apiRequest('/api/me/profile-progress');
  assert.equal(refreshed, 0);
  await apiRequest('/api/me/profile-import/apply', { method: 'POST' });
  assert.equal(refreshed, 1);
  await apiRequest('/api/me/discovery/attempts/1/answers', { method: 'POST' });
  assert.equal(refreshed, 1);
  respond({ success: true, data: { completedAt: '2026-10-10T10:00:00' } });
  await apiRequest('/api/me/discovery/attempts/1/answers', { method: 'POST' });
  assert.equal(refreshed, 2);
  respond({ success: false, message: 'Validation failed' }, 400);
  await assert.rejects(apiRequest('/api/me/skills/1', { method: 'PUT' }), /Validation failed/);
  assert.equal(refreshed, 2);
  unsubscribe();
});

test('an in-flight write keeps the original account scope if the session changes', async () => {
  let finish;
  globalThis.fetch = () => new Promise(resolve => { finish = resolve; });
  let mine = 0, other = 0;
  const unsubscribe = subscribeProfileChanges(7, () => mine++);
  const unsubscribeOther = subscribeProfileChanges(8, () => other++);
  const request = apiRequest('/api/me', { method: 'PATCH' });
  globalThis.sessionStorage = { getItem: () => JSON.stringify({ id: 8, token: 'another-token' }) };
  finish(new Response(JSON.stringify({ success: true, data: {} })));
  await request;
  assert.equal(mine, 1);
  assert.equal(other, 0);
  unsubscribe(); unsubscribeOther();
});
