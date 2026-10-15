import { Bell, UserPlus, UserCheck, Heart, MessageCircle, MessageSquare, AtSign, CornerDownRight, Handshake, BellRing, Flag as MilestoneIcon, Eye, GraduationCap, BadgeCheck, ThumbsUp, CircleCheck } from 'lucide-react';

/** Shared by the notifications page and the header bell so both read the same. */
export const descriptions = {
  FOLLOW: 'đã theo dõi bạn', CONNECTION: 'gửi lời mời kết nối', CONNECTED: 'đã chấp nhận kết nối', LIKE: 'thấy bài viết của bạn hữu ích',
  COMMENT: 'đã bình luận bài viết của bạn', MESSAGE: 'gửi tin nhắn cho bạn', REPLY: 'đã trả lời bình luận của bạn', MENTION: 'đã nhắc đến bạn',
  BUDDY_REQUEST: 'mời bạn làm bạn đồng hành', BUDDY_ACCEPTED: 'đã nhận lời làm bạn đồng hành', NUDGE: 'nhắc bạn giữ nhịp học tuần này', BUDDY_MILESTONE: 'vừa hoàn thành một tuần trong lộ trình',
  MENTOR_REQUEST: 'nhờ bạn hỗ trợ một buổi mentor', MENTOR_ACCEPTED: 'đã nhận lời và hẹn lịch hỗ trợ', MENTOR_UPDATED: 'đã đổi lịch buổi hỗ trợ',
  MENTOR_DECLINED: 'chưa thể nhận yêu cầu hỗ trợ của bạn', MENTOR_CANCELLED: 'đã hủy buổi hỗ trợ', MENTOR_COMPLETED: 'đã đánh giá buổi hỗ trợ của bạn',
  ENDORSE: 'đã xác nhận một kỹ năng hoặc dự án của bạn', FEEDBACK_HELPFUL: 'thấy góp ý của bạn hữu ích', ANSWER_ACCEPTED: 'đã chọn câu trả lời của bạn là lời giải',
};
export const describe = (n) => descriptions[n.kind] || 'đã tương tác với bạn';

/** Small badge on the actor's avatar telling what happened, so the list scans without reading every line. */
const KIND_ICON = {
  FOLLOW: Eye, CONNECTION: UserPlus, CONNECTED: UserCheck, LIKE: Heart, COMMENT: MessageCircle, MESSAGE: MessageSquare,
  REPLY: CornerDownRight, MENTION: AtSign, BUDDY_REQUEST: Handshake, BUDDY_ACCEPTED: Handshake, NUDGE: BellRing, BUDDY_MILESTONE: MilestoneIcon,
  MENTOR_REQUEST: GraduationCap, MENTOR_ACCEPTED: GraduationCap, MENTOR_UPDATED: GraduationCap, MENTOR_DECLINED: GraduationCap, MENTOR_CANCELLED: GraduationCap, MENTOR_COMPLETED: GraduationCap,
  ENDORSE: BadgeCheck, FEEDBACK_HELPFUL: ThumbsUp, ANSWER_ACCEPTED: CircleCheck,
};
export const kindIcon = (kind) => KIND_ICON[kind] || Bell;

const POST_KINDS = ['LIKE', 'COMMENT', 'REPLY', 'MENTION', 'BUDDY_MILESTONE', 'FEEDBACK_HELPFUL', 'ANSWER_ACCEPTED'];
const BUDDY_KINDS = ['BUDDY_REQUEST', 'BUDDY_ACCEPTED', 'NUDGE'];

/** Where a notification leads. A connection request opens the incoming-requests list, where it can be answered in place. */
export const notificationTarget = (n, myHandle) => n.kind === 'MESSAGE' ? `/network/messages/${n.ref_id}`
  : POST_KINDS.includes(n.kind) ? `/network/posts/${n.ref_id}`
    : n.kind === 'CONNECTION' ? '/network/connections?mode=requests'
      : BUDDY_KINDS.includes(n.kind) ? '/network/cohorts'
        : n.kind.startsWith('MENTOR_') ? '/network/mentors?tab=sessions'
          : n.kind === 'ENDORSE' && myHandle ? `/u/${myHandle}` : `/u/${n.handle}`;
