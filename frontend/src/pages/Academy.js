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

  // Admin state
  const [showAdminPanel, setShowAdminPanel] = useState(false);
  const [allVideos, setAllVideos] = useState([]);
  const [adminLoading, setAdminLoading] = useState(false);
  const [videoForm, setVideoForm] = useState({ titleAr: '', descriptionAr: '', order: 0, videoUrl: '', isActive: true });
  const [videoFile, setVideoFile] = useState(null);
  const [editingVideo, setEditingVideo] = useState(null);
  const [uploadingId, setUploadingId] = useState(null);
  const [uploadFileMap, setUploadFileMap] = useState({});

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

  const fetchAllVideosAdmin = async () => {
    setAdminLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get('/api/academy/videos/all', { headers: { Authorization: `Bearer ${token}` } });
      setAllVideos(res.data.videos || []);
    } catch (error) {
      console.error('Error fetching admin videos:', error);
    } finally {
      setAdminLoading(false);
    }
  };

  const handleOpenAdmin = () => {
    setShowAdminPanel(true);
    fetchAllVideosAdmin();
  };

  const handleVideoFormChange = (e) => {
    const { name, value, type, checked } = e.target;
    setVideoForm(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  };

  const handleCreateVideo = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      const payload = { ...videoForm };
      const res = await axios.post('/api/academy/videos', payload, { headers: { Authorization: `Bearer ${token}` } });
      const newVideo = res.data.video;
      // Upload file if selected
      if (videoFile && newVideo?._id) {
        const fd = new FormData();
        fd.append('video', videoFile);
        await axios.post(`/api/academy/videos/${newVideo._id}/upload`, fd, {
          headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'multipart/form-data' }
        });
      }
      setVideoForm({ titleAr: '', descriptionAr: '', order: 0, videoUrl: '', isActive: true });
      setVideoFile(null);
      fetchAllVideosAdmin();
      fetchData();
      alert(language === 'ar' ? 'تم إضافة الفيديو' : 'Video added');
    } catch (error) {
      alert(language === 'ar' ? 'فشل إضافة الفيديو' : 'Failed to add video');
    }
  };

  const handleOpenEditVideo = (video) => {
    setEditingVideo({ ...video, videoUrlNew: '', titleArNew: video.titleAr, descriptionArNew: video.descriptionAr || '', orderNew: video.order || 0, isActiveNew: video.isActive !== false });
  };

  const handleUpdateVideo = async (video) => {
    try {
      const token = localStorage.getItem('token');
      await axios.put(`/api/academy/videos/${video._id}`, {
        titleAr: video.titleArNew,
        descriptionAr: video.descriptionArNew,
        order: video.orderNew,
        isActive: video.isActiveNew,
        ...(video.videoUrlNew && { videoUrl: video.videoUrlNew })
      }, { headers: { Authorization: `Bearer ${token}` } });
      // Upload file if selected
      const file = uploadFileMap[video._id];
      if (file) {
        setUploadingId(video._id);
        const fd = new FormData();
        fd.append('video', file);
        await axios.post(`/api/academy/videos/${video._id}/upload`, fd, {
          headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'multipart/form-data' }
        });
        setUploadingId(null);
        setUploadFileMap(prev => { const n = { ...prev }; delete n[video._id]; return n; });
      }
      setEditingVideo(null);
      fetchAllVideosAdmin();
      fetchData();
      alert(language === 'ar' ? 'تم التحديث' : 'Updated');
    } catch (error) {
      alert(language === 'ar' ? 'فشل التحديث' : 'Failed to update');
    }
  };

  const handleDeleteVideo = async (id) => {
    if (!window.confirm(language === 'ar' ? 'هل أنت متأكد من حذف الفيديو؟' : 'Delete this video?')) return;
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`/api/academy/videos/${id}`, { headers: { Authorization: `Bearer ${token}` } });
      fetchAllVideosAdmin();
      fetchData();
    } catch (error) {
      alert(language === 'ar' ? 'فشل الحذف' : 'Failed to delete');
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
        {user?.role === 'super_admin' && (
          <button
            onClick={handleOpenAdmin}
            style={{ marginTop: '1rem', background: '#22513e', color: 'white', border: 'none', padding: '0.6rem 1.5rem', borderRadius: '8px', cursor: 'pointer', fontWeight: 600 }}
          >
            ⚙️ {language === 'ar' ? 'إدارة الفيديوهات' : 'Manage Videos'}
          </button>
        )}
      </div>

      {/* Admin Panel Modal */}
      {showAdminPanel && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000, overflowY: 'auto', padding: '1rem' }}>
          <div style={{ background: 'white', borderRadius: '12px', maxWidth: '700px', margin: '0 auto', padding: '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h2 style={{ margin: 0 }}>⚙️ {language === 'ar' ? 'إدارة الفيديوهات' : 'Manage Videos'}</h2>
              <button onClick={() => setShowAdminPanel(false)} style={{ background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer' }}>&times;</button>
            </div>

            {/* Add New Video Form */}
            <details style={{ marginBottom: '1.5rem', border: '1px solid #e5e7eb', borderRadius: '8px', padding: '1rem' }}>
              <summary style={{ fontWeight: 600, cursor: 'pointer', fontSize: '1rem' }}>
                ➕ {language === 'ar' ? 'إضافة فيديو جديد' : 'Add New Video'}
              </summary>
              <form onSubmit={handleCreateVideo} style={{ marginTop: '1rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <input type="text" name="titleAr" placeholder={language === 'ar' ? 'عنوان الفيديو *' : 'Video Title *'} value={videoForm.titleAr} onChange={handleVideoFormChange} required style={{ padding: '0.6rem', border: '1px solid #d1d5db', borderRadius: '6px' }} />
                <textarea name="descriptionAr" placeholder={language === 'ar' ? 'وصف الفيديو' : 'Description'} value={videoForm.descriptionAr} onChange={handleVideoFormChange} rows={2} style={{ padding: '0.6rem', border: '1px solid #d1d5db', borderRadius: '6px', resize: 'vertical' }} />
                <div style={{ display: 'flex', gap: '0.75rem' }}>
                  <input type="number" name="order" placeholder={language === 'ar' ? 'الترتيب' : 'Order'} value={videoForm.order} onChange={handleVideoFormChange} style={{ padding: '0.6rem', border: '1px solid #d1d5db', borderRadius: '6px', width: '100px' }} />
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <input type="checkbox" name="isActive" checked={videoForm.isActive} onChange={handleVideoFormChange} />
                    {language === 'ar' ? 'نشط' : 'Active'}
                  </label>
                </div>
                <div style={{ borderTop: '1px solid #f0f0f0', paddingTop: '0.75rem' }}>
                  <p style={{ fontSize: '0.85rem', color: '#6b7280', marginBottom: '0.5rem' }}>
                    {language === 'ar' ? 'رابط الفيديو أو رفع ملف:' : 'Video URL or upload file:'}
                  </p>
                  <input type="url" name="videoUrl" placeholder="https://..." value={videoForm.videoUrl} onChange={handleVideoFormChange} style={{ padding: '0.6rem', border: '1px solid #d1d5db', borderRadius: '6px', width: '100%', marginBottom: '0.5rem' }} />
                  <p style={{ textAlign: 'center', color: '#9ca3af', fontSize: '0.8rem' }}>{language === 'ar' ? '— أو —' : '— OR —'}</p>
                  <input type="file" accept="video/*" onChange={(e) => setVideoFile(e.target.files[0])} style={{ marginTop: '0.25rem' }} />
                  {videoFile && <p style={{ fontSize: '0.8rem', color: '#16a34a' }}>{videoFile.name}</p>}
                </div>
                <button type="submit" style={{ background: '#22513e', color: 'white', border: 'none', padding: '0.7rem', borderRadius: '8px', cursor: 'pointer', fontWeight: 600 }}>
                  {language === 'ar' ? 'إضافة الفيديو' : 'Add Video'}
                </button>
              </form>
            </details>

            {/* Videos List */}
            {adminLoading ? <p>Loading...</p> : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {allVideos.map((v) => (
                  <div key={v._id} style={{ border: '1px solid #e5e7eb', borderRadius: '8px', padding: '0.75rem' }}>
                    {editingVideo?._id === v._id ? (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        <input value={editingVideo.titleArNew} onChange={e => setEditingVideo(ev => ({ ...ev, titleArNew: e.target.value }))} style={{ padding: '0.5rem', border: '1px solid #d1d5db', borderRadius: '6px' }} />
                        <textarea value={editingVideo.descriptionArNew} onChange={e => setEditingVideo(ev => ({ ...ev, descriptionArNew: e.target.value }))} rows={2} style={{ padding: '0.5rem', border: '1px solid #d1d5db', borderRadius: '6px', resize: 'vertical' }} />
                        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                          <input type="number" value={editingVideo.orderNew} onChange={e => setEditingVideo(ev => ({ ...ev, orderNew: e.target.value }))} style={{ padding: '0.5rem', border: '1px solid #d1d5db', borderRadius: '6px', width: '80px' }} />
                          <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                            <input type="checkbox" checked={editingVideo.isActiveNew} onChange={e => setEditingVideo(ev => ({ ...ev, isActiveNew: e.target.checked }))} />
                            {language === 'ar' ? 'نشط' : 'Active'}
                          </label>
                        </div>
                        <p style={{ fontSize: '0.82rem', color: '#6b7280', margin: 0 }}>{language === 'ar' ? 'رابط الفيديو (اتركه فارغاً للإبقاء على الحالي):' : 'Video URL (leave empty to keep current):'}</p>
                        <input type="url" placeholder="https://..." value={editingVideo.videoUrlNew} onChange={e => setEditingVideo(ev => ({ ...ev, videoUrlNew: e.target.value }))} style={{ padding: '0.5rem', border: '1px solid #d1d5db', borderRadius: '6px' }} />
                        <p style={{ fontSize: '0.82rem', color: '#6b7280', margin: 0 }}>{language === 'ar' ? 'أو ارفع ملف فيديو:' : 'Or upload video file:'}</p>
                        <input type="file" accept="video/*" onChange={e => setUploadFileMap(prev => ({ ...prev, [v._id]: e.target.files[0] }))} />
                        {uploadFileMap[v._id] && <p style={{ fontSize: '0.8rem', color: '#16a34a' }}>{uploadFileMap[v._id].name}</p>}
                        {uploadingId === v._id && <p style={{ color: '#22513e' }}>⏳ {language === 'ar' ? 'جاري الرفع...' : 'Uploading...'}</p>}
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                          <button onClick={() => handleUpdateVideo(editingVideo)} style={{ flex: 1, background: '#22513e', color: 'white', border: 'none', padding: '0.5rem', borderRadius: '6px', cursor: 'pointer' }}>
                            {language === 'ar' ? 'حفظ' : 'Save'}
                          </button>
                          <button onClick={() => setEditingVideo(null)} style={{ flex: 1, background: '#f3f4f6', border: 'none', padding: '0.5rem', borderRadius: '6px', cursor: 'pointer' }}>
                            {language === 'ar' ? 'إلغاء' : 'Cancel'}
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '0.5rem' }}>
                        <div style={{ flex: 1 }}>
                          <span style={{ fontWeight: 600 }}>{v.order}. {v.titleAr}</span>
                          <span style={{ marginRight: '0.5rem', marginLeft: '0.5rem', fontSize: '0.8rem', color: v.isActive ? '#16a34a' : '#dc2626' }}>
                            {v.isActive ? '● نشط' : '● غير نشط'}
                          </span>
                          {v.videoUrl && <span style={{ fontSize: '0.75rem', color: '#6b7280' }}>🎬</span>}
                        </div>
                        <div style={{ display: 'flex', gap: '0.4rem' }}>
                          <button onClick={() => handleOpenEditVideo(v)} style={{ background: '#3b82f6', color: 'white', border: 'none', padding: '0.35rem 0.75rem', borderRadius: '6px', cursor: 'pointer', fontSize: '0.8rem' }}>
                            {language === 'ar' ? 'تعديل' : 'Edit'}
                          </button>
                          <button onClick={() => handleDeleteVideo(v._id)} style={{ background: '#ef4444', color: 'white', border: 'none', padding: '0.35rem 0.75rem', borderRadius: '6px', cursor: 'pointer', fontSize: '0.8rem' }}>
                            {language === 'ar' ? 'حذف' : 'Delete'}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

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
