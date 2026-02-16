import React, { useState, useEffect, useContext } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { AuthContext } from '../context/AuthContext';
import axios from 'axios';
import '../styles/Academy.css';

const Academy = () => {
  const { language } = useLanguage();
  const { user } = useContext(AuthContext);
  const [videos, setVideos] = useState([]);
  const [progress, setProgress] = useState({});
  const [loading, setLoading] = useState(true);
  const [activeVideo, setActiveVideo] = useState(null);
  const [showQuiz, setShowQuiz] = useState(false);
  const [answers, setAnswers] = useState({});
  const [quizResult, setQuizResult] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };
      const [videosRes, progressRes] = await Promise.all([
        axios.get('/api/academy/videos', { headers }),
        axios.get('/api/academy/progress', { headers })
      ]);

      setVideos(videosRes.data.videos || []);

      const progressMap = {};
      (progressRes.data.progress || []).forEach(p => {
        progressMap[p.video] = p;
      });
      setProgress(progressMap);
    } catch (error) {
      console.error('Error fetching academy data:', error);
    } finally {
      setLoading(false);
    }
  };

  const isVideoUnlocked = (video, index) => {
    if (index === 0) return true;
    const prevVideo = videos[index - 1];
    return progress[prevVideo._id]?.quizPassed === true;
  };

  const handleOpenVideo = (video) => {
    setActiveVideo(video);
    setShowQuiz(false);
    setAnswers({});
    setQuizResult(null);
  };

  const handleStartQuiz = () => {
    setShowQuiz(true);
    setAnswers({});
    setQuizResult(null);
  };

  const handleAnswerChange = (questionIndex, answerIndex) => {
    setAnswers(prev => ({ ...prev, [questionIndex]: answerIndex }));
  };

  const handleSubmitQuiz = async () => {
    if (!activeVideo) return;
    const questions = activeVideo.quiz?.questions || [];
    if (Object.keys(answers).length < questions.length) {
      alert(language === 'ar' ? 'يرجى الإجابة على جميع الأسئلة' : 'Please answer all questions');
      return;
    }

    setSubmitting(true);
    try {
      const token = localStorage.getItem('token');
      const answersArray = questions.map((_, i) => answers[i]);
      const res = await axios.post(
        `/api/academy/videos/${activeVideo._id}/quiz`,
        { answers: answersArray },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setQuizResult(res.data);
      if (res.data.passed) {
        setProgress(prev => ({
          ...prev,
          [activeVideo._id]: { quizPassed: true, quizScore: res.data.score }
        }));
      } else {
        setProgress(prev => ({
          ...prev,
          [activeVideo._id]: { ...prev[activeVideo._id], quizScore: res.data.score }
        }));
      }
    } catch (error) {
      alert(language === 'ar' ? 'حدث خطأ أثناء التسليم' : 'Error submitting quiz');
    } finally {
      setSubmitting(false);
    }
  };

  const getVideoStatus = (video, index) => {
    if (progress[video._id]?.quizPassed) return 'completed';
    if (isVideoUnlocked(video, index)) return 'unlocked';
    return 'locked';
  };

  if (loading) {
    return (
      <div className="academy-page">
        <div className="academy-loading">
          <div className="academy-spinner"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="academy-page">
      <div className="academy-hero">
        <h1>🎓 {language === 'ar' ? 'أكاديمية جيناي' : 'Jenai Academy'}</h1>
        <p>{language === 'ar' ? 'تعلم وطور مهاراتك' : 'Learn and Develop Your Skills'}</p>
      </div>

      <div className="academy-container">
        {videos.length === 0 ? (
          <div className="academy-empty">
            <p>🎬 {language === 'ar' ? 'لا توجد فيديوهات متاحة حالياً' : 'No videos available yet'}</p>
          </div>
        ) : (
          <div className="academy-layout">
            <div className="videos-list">
              <h2 className="videos-list-title">
                {language === 'ar' ? 'الفيديوهات' : 'Videos'}
              </h2>
              {videos.map((video, index) => {
                const status = getVideoStatus(video, index);
                return (
                  <div
                    key={video._id}
                    className={`video-item ${status} ${activeVideo?._id === video._id ? 'active' : ''}`}
                    onClick={() => status !== 'locked' && handleOpenVideo(video)}
                  >
                    <div className="video-item-number">{index + 1}</div>
                    <div className="video-item-info">
                      <span className="video-item-title">{video.titleAr}</span>
                      <span className="video-item-status">
                        {status === 'completed' && ('✅ ' + (language === 'ar' ? 'مكتمل' : 'Completed'))}
                        {status === 'unlocked' && ('▶️ ' + (language === 'ar' ? 'ابدأ' : 'Start'))}
                        {status === 'locked' && ('🔒 ' + (language === 'ar' ? 'مقفل' : 'Locked'))}
                      </span>
                    </div>
                    {progress[video._id]?.quizScore > 0 && (
                      <div className="video-score">{progress[video._id].quizScore}%</div>
                    )}
                  </div>
                );
              })}
            </div>

            <div className="video-content">
              {!activeVideo ? (
                <div className="video-placeholder-msg">
                  <p>👈 {language === 'ar' ? 'اختر فيديو من القائمة للبدء' : 'Select a video from the list to start'}</p>
                </div>
              ) : (
                <>
                  <h2 className="video-title">{activeVideo.titleAr}</h2>
                  {activeVideo.descriptionAr && (
                    <p className="video-description">{activeVideo.descriptionAr}</p>
                  )}

                  {activeVideo.videoUrl ? (
                    <div className="video-player-wrapper">
                      <video
                        key={activeVideo._id}
                        className="video-player"
                        controls
                        controlsList="nodownload"
                      >
                        <source src={activeVideo.videoUrl} />
                        {language === 'ar' ? 'متصفحك لا يدعم تشغيل الفيديو' : 'Your browser does not support video.'}
                      </video>
                    </div>
                  ) : (
                    <div className="video-no-file">
                      <p>⚠️ {language === 'ar' ? 'لم يتم رفع الفيديو بعد' : 'Video not uploaded yet'}</p>
                    </div>
                  )}

                  {activeVideo.quiz?.questions?.length > 0 && (
                    <div className="quiz-section">
                      {!showQuiz && !progress[activeVideo._id]?.quizPassed && (
                        <button className="start-quiz-btn" onClick={handleStartQuiz}>
                          📝 {language === 'ar' ? 'ابدأ الامتحان' : 'Start Quiz'}
                        </button>
                      )}

                      {progress[activeVideo._id]?.quizPassed && (
                        <div className="quiz-passed-banner">
                          ✅ {language === 'ar'
                            ? `اجتزت الامتحان بنجاح - ${progress[activeVideo._id].quizScore}%`
                            : `Quiz Passed - ${progress[activeVideo._id].quizScore}%`}
                        </div>
                      )}

                      {showQuiz && !quizResult && (
                        <div className="quiz-form">
                          <h3 className="quiz-title">
                            📝 {language === 'ar' ? 'الامتحان' : 'Quiz'}
                            <span className="quiz-passing-info">
                              ({language === 'ar' ? 'درجة النجاح' : 'Passing'}: {activeVideo.quiz.passingScore}%)
                            </span>
                          </h3>
                          {activeVideo.quiz.questions.map((q, qi) => (
                            <div key={q._id || qi} className="quiz-question">
                              <p className="question-text">{qi + 1}. {q.questionAr}</p>
                              <div className="question-options">
                                {q.type === 'truefalse' ? (
                                  <>
                                    <label className={`option-label ${answers[qi] === 0 ? 'selected' : ''}`}>
                                      <input type="radio" name={`q${qi}`} onChange={() => handleAnswerChange(qi, 0)} />
                                      ✔ {language === 'ar' ? 'صح' : 'True'}
                                    </label>
                                    <label className={`option-label ${answers[qi] === 1 ? 'selected' : ''}`}>
                                      <input type="radio" name={`q${qi}`} onChange={() => handleAnswerChange(qi, 1)} />
                                      ✖ {language === 'ar' ? 'خطأ' : 'False'}
                                    </label>
                                  </>
                                ) : (
                                  q.options.map((opt, oi) => (
                                    <label key={oi} className={`option-label ${answers[qi] === oi ? 'selected' : ''}`}>
                                      <input type="radio" name={`q${qi}`} onChange={() => handleAnswerChange(qi, oi)} />
                                      {opt}
                                    </label>
                                  ))
                                )}
                              </div>
                            </div>
                          ))}
                          <button
                            className="submit-quiz-btn"
                            onClick={handleSubmitQuiz}
                            disabled={submitting}
                          >
                            {submitting ? '...' : (language === 'ar' ? 'تسليم الإجابات' : 'Submit')}
                          </button>
                        </div>
                      )}

                      {quizResult && (
                        <div className={`quiz-result ${quizResult.passed ? 'passed' : 'failed'}`}>
                          <div className="result-icon">{quizResult.passed ? '🎉' : '😔'}</div>
                          <div className="result-score">
                            {quizResult.score}% ({quizResult.correct}/{quizResult.total})
                          </div>
                          <div className="result-message">
                            {quizResult.passed
                              ? (language === 'ar' ? 'أحسنت! اجتزت الامتحان' : 'Congratulations! You passed!')
                              : (language === 'ar'
                                ? `لم تجتز. درجة النجاح ${quizResult.passingScore}%`
                                : `Failed. Passing score is ${quizResult.passingScore}%`)}
                          </div>
                          {!quizResult.passed && (
                            <button
                              className="retry-quiz-btn"
                              onClick={() => { setShowQuiz(true); setAnswers({}); setQuizResult(null); }}
                            >
                              🔄 {language === 'ar' ? 'إعادة المحاولة' : 'Retry'}
                            </button>
                          )}
                          {quizResult.passed && (
                            <p className="next-video-hint">
                              ▶️ {language === 'ar' ? 'يمكنك الآن الانتقال للفيديو التالي' : 'You can now proceed to the next video'}
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Academy;
