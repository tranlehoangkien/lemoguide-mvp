import { useState, useEffect } from 'react';
import { ArrowLeft } from 'lucide-react';
import { useChat } from '@/context/ChatContext';
import { cvProfileService } from '@/services/cvProfileService';
import { jobPostingService } from '@/services/jobPostingService';
import './CvStudio.css';

const PROMPTS = [
  'Nhận xét CV của tôi: điểm mạnh và điểm yếu lớn nhất là gì?',
  'Viết lại phần mục tiêu nghề nghiệp của tôi cho thật ấn tượng.',
  'Phần kinh nghiệm nào của tôi cần thêm số liệu, và tôi nên bổ sung gì?',
  'Tôi nên đưa những từ khóa nào vào CV để vượt qua bộ lọc ATS?',
];

/**
 * Màn hình đầu của một cuộc trò chuyện AI Coach đã gắn với một CV (và việc làm): cho biết AI đang đọc dữ liệu
 * nào và gợi ý vài câu hỏi để bắt đầu. Ngữ cảnh do backend tự thêm vào mỗi lượt, người dùng không cần dán CV.
 */
const CvChatIntro = ({ cvProfileId, jobPostingId }) => {
  const { sendMessage, isTyping, startNewChat, setActiveTopic } = useChat();
  const [cvName, setCvName] = useState(null);
  const [jobName, setJobName] = useState(null);

  useEffect(() => {
    let cancelled = false;
    if (cvProfileId) {
      cvProfileService
        .getCvDetail(cvProfileId)
        .then((cv) => !cancelled && setCvName(cv?.title || null))
        .catch(() => {});
    }
    if (jobPostingId) {
      jobPostingService
        .getJob(jobPostingId)
        .then((job) => !cancelled && setJobName(job ? `${job.title} - ${job.companyName}` : null))
        .catch(() => {});
    }
    return () => {
      cancelled = true;
    };
  }, [cvProfileId, jobPostingId]);

  const backToStudio = () => {
    startNewChat();
    setActiveTopic('CV_OPTIMIZATION');
  };

  return (
    <div className="cvs-intro">
      <button type="button" className="cvs__back" onClick={backToStudio}>
        <ArrowLeft size={16} aria-hidden="true" /> Quay lại CV Studio
      </button>
      <h2 style={{ marginTop: 14 }}>Trao đổi về CV của bạn</h2>
      <ul className="cvs-intro__context" aria-label="Dữ liệu AI đang đọc">
        <li>CV: {cvName || `#${cvProfileId}`}</li>
        {jobPostingId && <li>Vị trí: {jobName || `#${jobPostingId}`}</li>}
      </ul>
      <ul className="cvs-intro__prompts">
        {PROMPTS.map((prompt) => (
          <li key={prompt}>
            <button type="button" disabled={isTyping} onClick={() => sendMessage(prompt)}>
              {prompt}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default CvChatIntro;
