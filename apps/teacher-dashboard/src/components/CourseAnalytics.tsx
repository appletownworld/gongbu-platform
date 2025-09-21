import React, { useState, useEffect } from 'react';
import { 
  TrendingUp, 
  TrendingDown, 
  Users, 
  Clock, 
  Award, 
  DollarSign,
  BarChart3,
  PieChart,
  Calendar
} from 'lucide-react';

interface CourseAnalyticsProps {
  courseId: string;
}

interface AnalyticsData {
  overview: {
    totalStudents: number;
    activeStudents: number;
    completedStudents: number;
    totalRevenue: number;
    averageRating: number;
    completionRate: number;
  };
  timeline: {
    date: string;
    enrollments: number;
    completions: number;
    revenue: number;
  }[];
  studentProgress: {
    studentId: string;
    studentName: string;
    progress: number;
    lastActivity: string;
    status: 'active' | 'completed' | 'inactive';
  }[];
  lessonStats: {
    lessonId: string;
    lessonTitle: string;
    views: number;
    completions: number;
    averageTime: number;
    rating: number;
  }[];
  revenue: {
    total: number;
    monthly: { month: string; amount: number }[];
    byLesson: { lessonId: string; lessonTitle: string; amount: number }[];
  };
}

export const CourseAnalytics: React.FC<CourseAnalyticsProps> = ({ courseId }) => {
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState<'7d' | '30d' | '90d' | '1y'>('30d');
  const [activeTab, setActiveTab] = useState<'overview' | 'students' | 'lessons' | 'revenue'>('overview');

  useEffect(() => {
    loadAnalyticsData();
  }, [courseId, selectedPeriod]);

  const loadAnalyticsData = async () => {
    try {
      setIsLoading(true);
      
      const response = await fetch(`/api/teacher/courses/${courseId}/analytics?period=${selectedPeriod}`);
      const data = await response.json();
      
      setAnalyticsData(data);
    } catch (error) {
      console.error('Ошибка загрузки аналитики:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ru-RU', {
      style: 'currency',
      currency: 'RUB',
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ru-RU', {
      day: 'numeric',
      month: 'short',
    });
  };

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}ч ${mins}м` : `${mins}м`;
  };

  if (isLoading) {
    return (
      <div className="analytics-loading">
        <div className="loading-spinner"></div>
        <p>Загрузка аналитики...</p>
      </div>
    );
  }

  if (!analyticsData) {
    return (
      <div className="analytics-error">
        <p>Ошибка загрузки данных аналитики</p>
      </div>
    );
  }

  return (
    <div className="course-analytics">
      <div className="analytics-header">
        <h2>📊 Аналитика курса</h2>
        <div className="analytics-controls">
          <select
            value={selectedPeriod}
            onChange={(e) => setSelectedPeriod(e.target.value as any)}
            className="form-select"
          >
            <option value="7d">Последние 7 дней</option>
            <option value="30d">Последние 30 дней</option>
            <option value="90d">Последние 90 дней</option>
            <option value="1y">Последний год</option>
          </select>
        </div>
      </div>

      <div className="analytics-tabs">
        <button
          className={`tab ${activeTab === 'overview' ? 'active' : ''}`}
          onClick={() => setActiveTab('overview')}
        >
          <BarChart3 size={20} />
          Обзор
        </button>
        <button
          className={`tab ${activeTab === 'students' ? 'active' : ''}`}
          onClick={() => setActiveTab('students')}
        >
          <Users size={20} />
          Студенты
        </button>
        <button
          className={`tab ${activeTab === 'lessons' ? 'active' : ''}`}
          onClick={() => setActiveTab('lessons')}
        >
          <Award size={20} />
          Уроки
        </button>
        <button
          className={`tab ${activeTab === 'revenue' ? 'active' : ''}`}
          onClick={() => setActiveTab('revenue')}
        >
          <DollarSign size={20} />
          Доходы
        </button>
      </div>

      <div className="analytics-content">
        {activeTab === 'overview' && (
          <div className="overview-analytics">
            {/* Основные метрики */}
            <div className="metrics-grid">
              <div className="metric-card">
                <div className="metric-icon">
                  <Users className="text-blue-500" size={24} />
                </div>
                <div className="metric-content">
                  <h3>{analyticsData.overview.totalStudents}</h3>
                  <p>Всего студентов</p>
                  <span className="metric-change positive">
                    <TrendingUp size={16} />
                    +12%
                  </span>
                </div>
              </div>

              <div className="metric-card">
                <div className="metric-icon">
                  <Award className="text-green-500" size={24} />
                </div>
                <div className="metric-content">
                  <h3>{analyticsData.overview.completionRate}%</h3>
                  <p>Завершили курс</p>
                  <span className="metric-change positive">
                    <TrendingUp size={16} />
                    +5%
                  </span>
                </div>
              </div>

              <div className="metric-card">
                <div className="metric-icon">
                  <DollarSign className="text-yellow-500" size={24} />
                </div>
                <div className="metric-content">
                  <h3>{formatCurrency(analyticsData.overview.totalRevenue)}</h3>
                  <p>Общий доход</p>
                  <span className="metric-change positive">
                    <TrendingUp size={16} />
                    +8%
                  </span>
                </div>
              </div>

              <div className="metric-card">
                <div className="metric-icon">
                  <Award className="text-purple-500" size={24} />
                </div>
                <div className="metric-content">
                  <h3>{analyticsData.overview.averageRating}⭐</h3>
                  <p>Средний рейтинг</p>
                  <span className="metric-change positive">
                    <TrendingUp size={16} />
                    +0.2
                  </span>
                </div>
              </div>
            </div>

            {/* График активности */}
            <div className="chart-section">
              <h3>📈 Активность по времени</h3>
              <div className="timeline-chart">
                {analyticsData.timeline.map((point, index) => (
                  <div key={index} className="timeline-point">
                    <div className="timeline-date">{formatDate(point.date)}</div>
                    <div className="timeline-metrics">
                      <div className="timeline-metric">
                        <Users size={14} />
                        <span>{point.enrollments} записей</span>
                      </div>
                      <div className="timeline-metric">
                        <Award size={14} />
                        <span>{point.completions} завершений</span>
                      </div>
                      <div className="timeline-metric">
                        <DollarSign size={14} />
                        <span>{formatCurrency(point.revenue)}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'students' && (
          <div className="students-analytics">
            <div className="students-header">
              <h3>👥 Прогресс студентов</h3>
              <div className="students-filters">
                <select className="form-select">
                  <option value="">Все статусы</option>
                  <option value="active">Активные</option>
                  <option value="completed">Завершившие</option>
                  <option value="inactive">Неактивные</option>
                </select>
              </div>
            </div>

            <div className="students-list">
              {analyticsData.studentProgress.map((student) => (
                <div key={student.studentId} className="student-progress-card">
                  <div className="student-info">
                    <div className="student-avatar">
                      {student.studentName.charAt(0).toUpperCase()}
                    </div>
                    <div className="student-details">
                      <h4>{student.studentName}</h4>
                      <p>Последняя активность: {formatDate(student.lastActivity)}</p>
                    </div>
                  </div>
                  
                  <div className="student-progress">
                    <div className="progress-bar">
                      <div 
                        className="progress-fill" 
                        style={{ width: `${student.progress}%` }}
                      ></div>
                    </div>
                    <span className="progress-text">{student.progress}%</span>
                  </div>

                  <div className="student-status">
                    <span className={`status-badge ${student.status}`}>
                      {student.status === 'active' && '🟢 Активен'}
                      {student.status === 'completed' && '✅ Завершил'}
                      {student.status === 'inactive' && '🔴 Неактивен'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'lessons' && (
          <div className="lessons-analytics">
            <h3>📚 Статистика по урокам</h3>
            
            <div className="lessons-stats">
              {analyticsData.lessonStats.map((lesson) => (
                <div key={lesson.lessonId} className="lesson-stat-card">
                  <div className="lesson-header">
                    <h4>{lesson.lessonTitle}</h4>
                    <div className="lesson-rating">
                      {lesson.rating}⭐
                    </div>
                  </div>
                  
                  <div className="lesson-metrics">
                    <div className="lesson-metric">
                      <Users size={16} />
                      <span>{lesson.views} просмотров</span>
                    </div>
                    <div className="lesson-metric">
                      <Award size={16} />
                      <span>{lesson.completions} завершений</span>
                    </div>
                    <div className="lesson-metric">
                      <Clock size={16} />
                      <span>{formatDuration(lesson.averageTime)} среднее время</span>
                    </div>
                  </div>

                  <div className="lesson-completion-rate">
                    <div className="completion-bar">
                      <div 
                        className="completion-fill" 
                        style={{ width: `${(lesson.completions / lesson.views) * 100}%` }}
                      ></div>
                    </div>
                    <span className="completion-text">
                      {((lesson.completions / lesson.views) * 100).toFixed(1)}% завершений
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'revenue' && (
          <div className="revenue-analytics">
            <div className="revenue-overview">
              <h3>💰 Доходы</h3>
              <div className="revenue-total">
                <span className="revenue-amount">
                  {formatCurrency(analyticsData.revenue.total)}
                </span>
                <span className="revenue-period">за выбранный период</span>
              </div>
            </div>

            <div className="revenue-charts">
              <div className="revenue-chart">
                <h4>📈 Доходы по месяцам</h4>
                <div className="monthly-revenue">
                  {analyticsData.revenue.monthly.map((month) => (
                    <div key={month.month} className="month-bar">
                      <div className="month-label">{month.month}</div>
                      <div className="month-amount">{formatCurrency(month.amount)}</div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="revenue-chart">
                <h4>📊 Доходы по урокам</h4>
                <div className="lesson-revenue">
                  {analyticsData.revenue.byLesson.map((lesson) => (
                    <div key={lesson.lessonId} className="lesson-revenue-item">
                      <div className="lesson-title">{lesson.lessonTitle}</div>
                      <div className="lesson-amount">{formatCurrency(lesson.amount)}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
