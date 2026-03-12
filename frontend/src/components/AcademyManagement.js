import React, { useState, useEffect } from 'react';
import axios from 'axios';

const AcademyManagement = () => {
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showVideoForm, setShowVideoForm] = useState(false);
  const [editingVideo, setEditingVideo] = useState(null);
  const [videoUploading, setVideoUploading] = useState(false);
  const [videoUploadProgress, setVideoUploadProgress] = useState(null);
  const [newVideo, setNewVideo] = useState({
    titleAr: '', title: '', descriptionAr: '', order: 0,
    quiz: { questions: [], passingScore: 60 }
  });
  const [newQuestion, setNewQuestion] = useState({
    questionAr: '', type: 'mcq', options: ['', '', '', ''], correctAnswer: 0
  });
  const [videoFile, setVideoFile] = useState(null);

  const getHeaders = () => ({ Authorization: `Bearer ${localStorage.getItem('token')}` });

  useEffect(() => {
    fetchVideos();
  }, []);

  const fetchVideos = async () => {
    try {
      setLoading(true);
      const { data } = await axios.get('/api/academy/videos/all', { headers: getHeaders() });
      setVideos(data.videos || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveVideo = async (e) => {
    e.preventDefault();
    const videoData = editingVideo || newVideo;
    try {
      if (editingVideo) {
        await axios.put(`/api/academy/videos/${editingVideo._id}`, videoData, { headers: getHeaders() });
      } else {
        const res = await axios.post('/api/academy/videos', videoData, { headers: getHeaders() });
        if (videoFile && res.data.video?._id) {
          const formData = new FormData();
          formData.append('video', videoFile);
          await axios.post(`/api/academy/videos/${res.data.video._id}/upload`, formData, {
            headers: { ...getHeaders(), 'Content-Type': 'multipart/form-data' }
          });
        }
      }
      setShowVideoForm(false);
      setEditingVideo(null);
      setNewVideo({ titleAr: '', title: '', descriptionAr: '', order: 0, quiz: { questions: [], passingScore: 60 } });
      setVideoFile(null);
      fetchVideos();
      alert('تم الحفظ بنجاح');
    } catch (error) {
      alert('فشل في الحفظ: ' + (error.response?.data?.message || error.message));
    }
  };

  const handleUploadVideo = async (videoId) => {
    if (!videoFile) return;
    const formData = new FormData();
    formData.append('video', videoFile);
    setVideoUploading(true);
    setVideoUploadProgress('جاري الرفع...');
    try {
      await axios.post(`/api/academy/videos/${videoId}/upload`, formData, {
        headers: { ...getHeaders(), 'Content-Type': 'multipart/form-data' }
      });
      setVideoFile(null);
      setVideoUploadProgress(null);
      fetchVideos();
      alert('تم رفع الفيديو بنجاح');
    } catch (error) {
      alert('فشل رفع الفيديو: ' + (error.response?.data?.message || error.message));
    } finally {
      setVideoUploading(false);
    }
  };

  const handleDeleteVideo = async (id) => {
    if (window.confirm('هل أنت متأكد من حذف هذا الفيديو؟')) {
      try {
        await axios.delete(`/api/academy/videos/${id}`, { headers: getHeaders() });
        fetchVideos();
      } catch (error) {
        alert('فشل في الحذف');
      }
    }
  };

  const handleAddQuestion = (videoData, setVideoData) => {
    if (!newQuestion.questionAr.trim()) return;
    const q = { ...newQuestion };
    if (q.type === 'truefalse') q.options = [];
    const updatedQuestions = [...(videoData.quiz?.questions || []), q];
    setVideoData({ ...videoData, quiz: { ...videoData.quiz, questions: updatedQuestions } });
    setNewQuestion({ questionAr: '', type: 'mcq', options: ['', '', '', ''], correctAnswer: 0 });
  };

  const handleRemoveQuestion = (qi, videoData, setVideoData) => {
    const updatedQuestions = (videoData.quiz?.questions || []).filter((_, i) => i !== qi);
    setVideoData({ ...videoData, quiz: { ...videoData.quiz, questions: updatedQuestions } });
  };

  if (loading) return <div style={{ padding: '2rem', textAlign: 'center' }}>جاري التحميل...</div>;

  const videoData = editingVideo || newVideo;
  const setVideoData = editingVideo ? setEditingVideo : setNewVideo;

  return (
    <div>
      <div className="tab-header">
        <h3>🎓 إدارة الأكاديمية</h3>
        <button
          onClick={() => {
            setShowVideoForm(!showVideoForm);
            setEditingVideo(null);
            setNewVideo({ titleAr: '', title: '', descriptionAr: '', order: videos.length, quiz: { questions: [], passingScore: 60 } });
          }}
          className="add-btn"
        >
          {showVideoForm ? 'إلغاء' : '+ إضافة فيديو'}
        </button>
      </div>

      {/* نموذج إضافة/تعديل فيديو */}
      {(showVideoForm || editingVideo) && (
        <form onSubmit={handleSaveVideo} className="product-form" style={{ marginBottom: '2rem' }}>
          <h4>{editingVideo ? 'تعديل الفيديو' : 'إضافة فيديو جديد'}</h4>

          <div className="form-row">
            <div className="form-group">
              <label>العنوان (عربي) *</label>
              <input required value={videoData.titleAr} onChange={e => setVideoData({ ...videoData, titleAr: e.target.value })} placeholder="عنوان الفيديو بالعربي" />
            </div>
            <div className="form-group">
              <label>العنوان (إنجليزي)</label>
              <input value={videoData.title} onChange={e => setVideoData({ ...videoData, title: e.target.value })} placeholder="Video title in English" />
            </div>
          </div>

          <div className="form-group">
            <label>الوصف (اختياري)</label>
            <textarea value={videoData.descriptionAr} onChange={e => setVideoData({ ...videoData, descriptionAr: e.target.value })} placeholder="وصف الفيديو" rows="2" />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>الترتيب</label>
              <input type="number" value={videoData.order} onChange={e => setVideoData({ ...videoData, order: Number(e.target.value) })} min="0" />
            </div>
            <div className="form-group">
              <label>درجة النجاح في الامتحان (%)</label>
              <input type="number" value={videoData.quiz?.passingScore || 60} onChange={e => setVideoData({ ...videoData, quiz: { ...videoData.quiz, passingScore: Number(e.target.value) } })} min="0" max="100" />
            </div>
          </div>

          {/* رابط الفيديو أو رفع ملف */}
          <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '8px', padding: '1rem', marginBottom: '1rem' }}>
            <p style={{ fontWeight: 600, color: '#15803d', marginBottom: '0.75rem' }}>🎬 رابط الفيديو أو رفع ملف</p>
            <div style={{ marginBottom: '0.75rem' }}>
              <label style={{ display: 'block', marginBottom: '0.4rem', fontWeight: 500 }}>رابط الفيديو (URL)</label>
              <input
                type="text"
                placeholder="https://..."
                value={videoData.videoUrl || ''}
                onChange={e => setVideoData({ ...videoData, videoUrl: e.target.value })}
                style={{ width: '100%', padding: '0.6rem', border: '1px solid #d1d5db', borderRadius: '6px', boxSizing: 'border-box' }}
              />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '0.4rem', fontWeight: 500 }}>رفع ملف فيديو (MP4, WebM...)</label>
              <input type="file" accept="video/*" onChange={e => setVideoFile(e.target.files[0])} style={{ display: 'block' }} />
              {editingVideo && videoFile && (
                <button type="button" className="edit-btn" style={{ marginTop: '0.5rem' }} disabled={videoUploading} onClick={() => handleUploadVideo(editingVideo._id)}>
                  {videoUploading ? (videoUploadProgress || 'جاري الرفع...') : 'رفع الآن'}
                </button>
              )}
              {!editingVideo && videoFile && <small style={{ color: '#16a34a', display: 'block', marginTop: '0.25rem' }}>✓ {videoFile.name} — سيتم الرفع عند الحفظ</small>}
              {editingVideo?.videoUrl && <small style={{ color: '#888', display: 'block', marginTop: '0.25rem' }}>الملف الحالي: {editingVideo.videoUrl}</small>}
            </div>
          </div>

          {/* إضافة الأسئلة */}
          <div style={{ marginTop: '1rem', background: '#f9f9f9', borderRadius: '8px', padding: '1rem' }}>
            <h5 style={{ marginBottom: '0.75rem', color: '#22513e' }}>📝 أسئلة الامتحان</h5>

            {(videoData.quiz?.questions || []).map((q, qi) => (
              <div key={qi} style={{ background: 'white', border: '1px solid #eee', borderRadius: '6px', padding: '0.75rem', marginBottom: '0.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <strong>{qi + 1}. {q.questionAr}</strong>
                  <span style={{ marginRight: '0.5rem', fontSize: '0.8rem', color: '#888' }}>({q.type === 'mcq' ? 'اختيار متعدد' : 'صح/خطأ'})</span>
                  <br />
                  {q.type === 'mcq' && q.options.map((opt, oi) => (
                    <small key={oi} style={{ color: oi === q.correctAnswer ? '#22513e' : '#666', fontWeight: oi === q.correctAnswer ? '700' : 'normal', display: 'inline-block', marginLeft: '0.5rem' }}>
                      {oi === q.correctAnswer ? '✓' : '○'} {opt}
                    </small>
                  ))}
                  {q.type === 'truefalse' && (
                    <small style={{ color: '#666' }}>{q.correctAnswer === 0 ? '✓ صح' : '✓ خطأ'}</small>
                  )}
                </div>
                <button type="button" className="delete-btn" style={{ padding: '0.2rem 0.5rem', fontSize: '0.75rem' }} onClick={() => handleRemoveQuestion(qi, videoData, setVideoData)}>حذف</button>
              </div>
            ))}

            {/* نموذج إضافة سؤال */}
            <div style={{ background: '#eef7f2', borderRadius: '6px', padding: '0.75rem', marginTop: '0.5rem' }}>
              <div className="form-row">
                <div className="form-group" style={{ flex: 2 }}>
                  <label>نص السؤال *</label>
                  <input value={newQuestion.questionAr} onChange={e => setNewQuestion({ ...newQuestion, questionAr: e.target.value })} placeholder="نص السؤال بالعربي" />
                </div>
                <div className="form-group">
                  <label>النوع</label>
                  <select value={newQuestion.type} onChange={e => setNewQuestion({ ...newQuestion, type: e.target.value, correctAnswer: 0 })}>
                    <option value="mcq">اختيار متعدد</option>
                    <option value="truefalse">صح / خطأ</option>
                  </select>
                </div>
              </div>

              {newQuestion.type === 'mcq' && (
                <div>
                  <div className="form-row">
                    {newQuestion.options.map((opt, oi) => (
                      <div key={oi} className="form-group">
                        <label>الخيار {oi + 1}</label>
                        <input value={opt} onChange={e => { const opts = [...newQuestion.options]; opts[oi] = e.target.value; setNewQuestion({ ...newQuestion, options: opts }); }} placeholder={`الخيار ${oi + 1}`} />
                      </div>
                    ))}
                  </div>
                  <div className="form-group">
                    <label>الإجابة الصحيحة</label>
                    <select value={newQuestion.correctAnswer} onChange={e => setNewQuestion({ ...newQuestion, correctAnswer: Number(e.target.value) })}>
                      {newQuestion.options.map((opt, oi) => (
                        <option key={oi} value={oi}>{opt || `الخيار ${oi + 1}`}</option>
                      ))}
                    </select>
                  </div>
                </div>
              )}

              {newQuestion.type === 'truefalse' && (
                <div className="form-group">
                  <label>الإجابة الصحيحة</label>
                  <select value={newQuestion.correctAnswer} onChange={e => setNewQuestion({ ...newQuestion, correctAnswer: Number(e.target.value) })}>
                    <option value={0}>صح</option>
                    <option value={1}>خطأ</option>
                  </select>
                </div>
              )}

              <button type="button" className="edit-btn" onClick={() => handleAddQuestion(videoData, setVideoData)} disabled={!newQuestion.questionAr.trim()}>
                + إضافة السؤال
              </button>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem' }}>
            <button type="submit" className="add-btn">{editingVideo ? 'حفظ التعديلات' : 'إنشاء الفيديو'}</button>
            <button type="button" className="delete-btn" onClick={() => { setShowVideoForm(false); setEditingVideo(null); }}>إلغاء</button>
          </div>
        </form>
      )}

      {/* جدول الفيديوهات */}
      <table className="data-table">
        <thead>
          <tr>
            <th>#</th>
            <th>العنوان</th>
            <th>الترتيب</th>
            <th>الأسئلة</th>
            <th>درجة النجاح</th>
            <th>فيديو</th>
            <th>الإجراءات</th>
          </tr>
        </thead>
        <tbody>
          {videos.map((video, idx) => (
            <tr key={video._id}>
              <td>{idx + 1}</td>
              <td><strong>{video.titleAr}</strong><br /><small style={{ color: '#888' }}>{video.title}</small></td>
              <td>{video.order}</td>
              <td>{video.quiz?.questions?.length || 0} سؤال</td>
              <td>{video.quiz?.passingScore || 60}%</td>
              <td>{video.videoUrl ? <span style={{ color: '#22513e' }}>✅ مرفوع</span> : <span style={{ color: '#dc3545' }}>❌ لا يوجد</span>}</td>
              <td className="action-buttons">
                <button onClick={() => { setEditingVideo({ ...video }); setShowVideoForm(false); }} className="edit-btn">تعديل</button>
                <button onClick={() => handleDeleteVideo(video._id)} className="delete-btn">حذف</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {videos.length === 0 && (
        <div className="no-data">لا توجد فيديوهات حالياً. قم بإضافة فيديو جديد.</div>
      )}
    </div>
  );
};

export default AcademyManagement;
