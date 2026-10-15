import { useEffect, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { AlertCircle, GraduationCap, Search, User, X } from 'lucide-react';
import UserLayout from '@/components/layout/UserLayout';
import Pagination from '@/components/common/Pagination';
import { Page, PageHeader, Card, Toolbar, ToolbarGroup, Button, EmptyState, SearchBox, FilterSelect, Segmented, ResetRefreshButtons, LIST_GRID_OPTIONS } from '@/components/ui';
import { ROUTES } from '@/constants/routes';
import { courseService, COURSE_LEVEL_LABELS, COURSE_SORT_OPTIONS } from '@/services/courseService';
import CourseCard from './CourseCard';
import './Courses.css';

const PAGE_SIZE = 12;
const FILTER_KEYS = ['keyword', 'level', 'provider', 'isFree', 'skillId', 'technologyId'];

function CourseSearch({ keyword, onSearch }) {
  const [value, setValue] = useState(keyword);
  const onSearchRef = useRef(onSearch);
  onSearchRef.current = onSearch;

  useEffect(() => {
    setValue(keyword);
  }, [keyword]);

  useEffect(() => {
    const timer = setTimeout(() => {
      const trimmed = value.trim().slice(0, 200);
      if (trimmed !== keyword) {
        onSearchRef.current(trimmed);
      }
    }, 350);
    return () => clearTimeout(timer);
  }, [value, keyword]);

  const handleClear = () => {
    setValue('');
    if (keyword) onSearchRef.current('');
  };

  return (
    <form className="course-search" onSubmit={(e) => { e.preventDefault(); onSearch(value.trim().slice(0, 200)); }} role="search">
      <SearchBox
        label="Tìm khóa học theo tên hoặc nhà cung cấp"
        placeholder="Tên khóa học hoặc nhà cung cấp…"
        value={value}
        onChange={setValue}
        onClear={handleClear}
      />
    </form>
  );
}

export default function CourseCatalogPage() {
  const [params, setParams] = useSearchParams();
  const [refresh, setRefresh] = useState(0);
  const [result, setResult] = useState(null);
  const [options, setOptions] = useState({ providers: [], skills: [], technologies: [] });
  const [optionsError, setOptionsError] = useState('');
  const resultsRef = useRef(null);
  const pageValue = Number(params.get('page') || 1);
  const page = Number.isSafeInteger(pageValue) && pageValue > 0 && pageValue < 100000 ? pageValue : 1;
  const display = params.get('view') === 'grid' ? 'grid' : 'list';
  const keyword = params.get('keyword') || '';
  const query = new URLSearchParams({ page: String(page - 1), size: String(PAGE_SIZE), order: params.get('order') || 'newest' });
  FILTER_KEYS.forEach((key) => { if (params.get(key)) query.set(key, params.get(key)); });
  const queryString = query.toString();
  const loadKey = `${queryString}:${refresh}`;
  const loading = result?.key !== loadKey;
  const data = loading ? null : result?.data;
  const error = loading ? '' : result?.error;

  useEffect(() => {
    const controller = new AbortController();
    courseService.list(Object.fromEntries(new URLSearchParams(queryString)), { signal: controller.signal })
      .then((loaded) => { if (!controller.signal.aborted) setResult({ key: loadKey, data: loaded }); })
      .catch((err) => { if (!controller.signal.aborted) setResult({ key: loadKey, error: err.message || 'Không tải được danh sách khóa học.' }); });
    return () => controller.abort();
  }, [queryString, loadKey]);

  useEffect(() => {
    const controller = new AbortController();
    courseService.filters({ signal: controller.signal })
      .then((loaded) => { if (!controller.signal.aborted) { setOptions(loaded); setOptionsError(''); } })
      .catch(() => { if (!controller.signal.aborted) setOptionsError('Chưa tải được danh mục bộ lọc. Bạn vẫn có thể tìm theo tên, cấp độ và học phí.'); });
    return () => controller.abort();
  }, [refresh]);

  const update = (key, value) => {
    setParams((current) => {
      const next = new URLSearchParams(current);
      if (value !== '' && value != null) next.set(key, String(value)); else next.delete(key);
      if (!['page', 'view'].includes(key)) next.delete('page');
      return next;
    });
  };
  const reset = () => { setParams(display === 'grid' ? { view: 'grid' } : {}); setRefresh((value) => value + 1); };
  const filterLabel = (key) => {
    const value = params.get(key);
    if (key === 'keyword') return `Tìm: ${value}`;
    if (key === 'level') return COURSE_LEVEL_LABELS[value] || value;
    if (key === 'isFree') return value === 'true' ? 'Miễn phí' : 'Có học phí';
    if (key === 'skillId') return options.skills.find((s) => String(s.id) === value)?.name || 'Kỹ năng đã chọn';
    if (key === 'technologyId') return options.technologies.find((t) => String(t.id) === value)?.name || 'Công nghệ đã chọn';
    return value;
  };
  const active = FILTER_KEYS.filter((key) => params.get(key));

  return (
    <UserLayout>
      <Page className="courses-page">
        <PageHeader title="Khóa học" description="Khám phá khóa học phù hợp với mục tiêu nghề nghiệp và phát triển kỹ năng của bạn."
          actions={<>
            <Link className="ui-btn ui-btn--secondary" to={ROUTES.PROFILE}><User size={16} /> Hồ sơ của tôi</Link>
            <Segmented value={display} onChange={(value) => update('view', value)} label="Kiểu hiển thị khóa học"
              options={LIST_GRID_OPTIONS} />
          </>} />

        <div className="course-toolbar">
          <Toolbar>
            <CourseSearch key={refresh} keyword={keyword} onSearch={(value) => update('keyword', value)} />
            <ToolbarGroup>
              <FilterSelect label="Cấp độ" value={params.get('level') || ''} onChange={(value) => update('level', value)}>
                <option value="">Tất cả cấp độ</option>{Object.entries(COURSE_LEVEL_LABELS).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
              </FilterSelect>
              <FilterSelect label="Học phí" value={params.get('isFree') || ''} onChange={(value) => update('isFree', value)}>
                <option value="">Tất cả học phí</option><option value="true">Miễn phí</option><option value="false">Có học phí</option>
              </FilterSelect>
              <FilterSelect label="Nhà cung cấp" value={params.get('provider') || ''} onChange={(value) => update('provider', value)}>
                <option value="">Tất cả nhà cung cấp</option>{options.providers.map((name) => <option key={name} value={name}>{name}</option>)}
              </FilterSelect>
              <ResetRefreshButtons onReset={reset} onRefresh={() => setRefresh((v) => v + 1)} loading={loading} />
            </ToolbarGroup>
          </Toolbar>
          {active.length > 0 && <div className="course-active-filters">
            {active.map((key) => <button type="button" key={key} onClick={() => update(key, '')} className="course-filter-chip" aria-label={`Bỏ lọc ${filterLabel(key)}`}>
              {filterLabel(key)}<X size={13} aria-hidden="true" />
            </button>)}
          </div>}
          {optionsError && <p role="status" className="ui-hint">{optionsError}</p>}
        </div>

        <section ref={resultsRef} className="course-results" aria-label="Danh sách khóa học" aria-busy={loading}>
          <div className="course-results-heading course-results-heading--actions-only">
            <div className="course-actions">
              <FilterSelect label="Kỹ năng" value={params.get('skillId') || ''} onChange={(value) => update('skillId', value)}>
                <option value="">Tất cả kỹ năng</option>{options.skills.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
              </FilterSelect>
              <FilterSelect label="Công nghệ" value={params.get('technologyId') || ''} onChange={(value) => update('technologyId', value)}>
                <option value="">Tất cả công nghệ</option>{options.technologies.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
              </FilterSelect>
              <FilterSelect label="Sắp xếp khóa học" value={params.get('order') || 'newest'} onChange={(value) => update('order', value)}>
                {COURSE_SORT_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
              </FilterSelect>
            </div>
          </div>
          {loading ? <Card><div role="status"><EmptyState icon={GraduationCap} title="Đang tải khóa học…" hint="Đang tìm nội dung phù hợp với bộ lọc của bạn." /></div></Card>
            : error ? <Card><div role="alert"><EmptyState icon={AlertCircle} title="Không thể tải khóa học" hint={error}
              action={<div className="course-actions"><Button onClick={() => setRefresh((v) => v + 1)}>Thử lại</Button><Button variant="secondary" onClick={reset}>Đặt lại bộ lọc</Button></div>} /></div></Card>
              : !data?.content?.length ? <Card><EmptyState icon={Search} title={page > 1 ? 'Trang này chưa có khóa học' : 'Chưa tìm thấy khóa học'}
                hint="Thử từ khóa khác hoặc bớt điều kiện lọc để xem thêm kết quả."
                action={<Button variant="secondary" onClick={page > 1 ? () => update('page', 1) : reset}>{page > 1 ? 'Về trang đầu' : 'Xóa bộ lọc'}</Button>} /></Card>
                : <>
                  <div className={`course-grid${display === 'list' ? ' course-grid--list' : ''}`}>
                    {data.content.map((course) => <CourseCard key={course.id} course={course} display={display} returnSearch={`?${params}`} />)}
                  </div>
                  <Card><Pagination currentPage={page} totalPages={data.totalPages} totalElements={data.totalElements} pageSize={PAGE_SIZE}
                    onPageChange={(value) => { update('page', value); resultsRef.current?.scrollIntoView({ block: 'start' }); }} entityName="khóa học" /></Card>
                </>}
        </section>
      </Page>
    </UserLayout>
  );
}
