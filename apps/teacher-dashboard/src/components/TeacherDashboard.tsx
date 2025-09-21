import React, { useState, useEffect } from 'react';
import { 
  Users, 
  BookOpen, 
  TrendingUp, 
  DollarSign, 
  Clock, 
  Award,
  BarChart3,
  FileText,
  MessageSquare,
  Settings
} from 'lucide-react';

interface DashboardStats {
  totalStudents: number;
  totalCourses: number;
  totalRevenue: number;
  activeCourses: number;
  completionRate: number;
  averageRating: number;
}

interface RecentActivity {
  id: string;
  type: 'enrollment' | 'completion' | 'payment' | 'review';
  student: string;
  course: string;
  timestamp: string;
  amount?: number;
}

interface Course {
  id: string;
  title: string;
  students: number;
  revenue: number;
  completionRate: number;
  rating: number;
  status: 'active' | 'draft' | 'archived';
}

export const TeacherDashboard: React.FC = () => {
  const [stats, setStats] = useState<DashboardStats>({
    totalStudents: 0,
    totalCourses: 0,
    totalRevenue: 0,
    activeCourses: 0,
    completionRate: 0,
    averageRating: 0,
  });

  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'courses' | 'students' | 'analytics'>('overview');

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setIsLoading(true);
      
      // Загружаем статистику
      const statsResponse = await fetch('/api/teacher/dashboard/stats');
      const statsData = await statsResponse.json();
      setStats(statsData);

      // Загружаем последнюю активность
      const activityResponse = await fetch('/api/teacher/dashboard/activity');
      const activityData = await activityResponse.json();
      setRecentActivity(activityData);

      // Загружаем курсы
      const coursesResponse = await fetch('/api/teacher/courses');
      const coursesData = await coursesResponse.json();
      setCourses(coursesData);

    } catch (error) {
      console.error('Ошибка загрузки данных:', error);
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
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (isLoading) {
    return (
      <div className="dashboard-loading">
        <div className="loading-spinner"></div>
        <p>Загрузка данных...</p>
      </div>
    );
  }

  return (
    <div className="teacher-dashboard">
      <div className="dashboard-header">
        <h1>📊 Панель преподавателя</h1>
        <div className="header-actions">
          <button className="btn-primary">
            ➕ Создать курс
          </button>
          <button className="btn-secondary">
            ⚙️ Настройки
          </button>
        </div>
      </div>

      <div className="dashboard-tabs">
        <button
          className={`tab ${activeTab === 'overview' ? 'active' : ''}`}
          onClick={() => setActiveTab('overview')}
        >
          <BarChart3 size={20} />
          Обзор
        </button>
        <button
          className={`tab ${activeTab === 'courses' ? 'active' : ''}`}
          onClick={() => setActiveTab('courses')}
        >
          <BookOpen size={20} />
          Курсы
        </button>
        <button
          className={`tab ${activeTab === 'students' ? 'active' : ''}`}
          onClick={() => setActiveTab('students')}
        >
          <Users size={20} />
          Студенты
        </button>
        <button
          className={`tab ${activeTab === 'analytics' ? 'active' : ''}`}
          onClick={() => setActiveTab('analytics')}
        >
          <TrendingUp size={20} />
          Аналитика
        </button>
      </div>

      <div className="dashboard-content">
        {activeTab === 'overview' && (
          <div className="overview-tab">
            {/* Статистические карточки */}
            <div className="stats-grid">
              <div className="stat-card">
                <div className="stat-icon">
                  <Users className="text-blue-500" size={24} />
                </div>
                <div className="stat-content">
                  <h3>{stats.totalStudents}</h3>
                  <p>Всего студентов</p>
                  <span className="stat-change positive">+12% за месяц</span>
                </div>
              </div>

              <div className="stat-card">
                <div className="stat-icon">
                  <BookOpen className="text-green-500" size={24} />
                </div>
                <div className="stat-content">
                  <h3>{stats.totalCourses}</h3>
                  <p>Активных курсов</p>
                  <span className="stat-change positive">+2 новых</span>
                </div>
              </div>

              <div className="stat-card">
                <div className="stat-icon">
                  <DollarSign className="text-yellow-500" size={24} />
                </div>
                <div className="stat-content">
                  <h3>{formatCurrency(stats.totalRevenue)}</h3>
                  <p>Общий доход</p>
                  <span className="stat-change positive">+8% за месяц</span>
                </div>
              </div>

              <div className="stat-card">
                <div className="stat-icon">
                  <Award className="text-purple-500" size={24} />
                </div>
                <div className="stat-content">
                  <h3>{stats.completionRate}%</h3>
                  <p>Процент завершений</p>
                  <span className="stat-change positive">+5% за месяц</span>
                </div>
              </div>
            </div>

            {/* Последняя активность */}
            <div className="activity-section">
              <h2>📈 Последняя активность</h2>
              <div className="activity-list">
                {recentActivity.map((activity) => (
                  <div key={activity.id} className="activity-item">
                    <div className="activity-icon">
                      {activity.type === 'enrollment' && <Users size={16} />}
                      {activity.type === 'completion' && <Award size={16} />}
                      {activity.type === 'payment' && <DollarSign size={16} />}
                      {activity.type === 'review' && <MessageSquare size={16} />}
                    </div>
                    <div className="activity-content">
                      <p>
                        {activity.type === 'enrollment' && `${activity.student} записался на курс`}
                        {activity.type === 'completion' && `${activity.student} завершил курс`}
                        {activity.type === 'payment' && `${activity.student} оплатил курс`}
                        {activity.type === 'review' && `${activity.student} оставил отзыв`}
                        <span className="activity-course"> "{activity.course}"</span>
                      </p>
                      <span className="activity-time">{formatDate(activity.timestamp)}</span>
                    </div>
                    {activity.amount && (
                      <div className="activity-amount">
                        {formatCurrency(activity.amount)}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'courses' && (
          <div className="courses-tab">
            <div className="courses-header">
              <h2>📚 Мои курсы</h2>
              <button className="btn-primary">
                ➕ Создать новый курс
              </button>
            </div>

            <div className="courses-grid">
              {courses.map((course) => (
                <div key={course.id} className="course-card">
                  <div className="course-header">
                    <h3>{course.title}</h3>
                    <span className={`course-status ${course.status}`}>
                      {course.status === 'active' && '🟢 Активен'}
                      {course.status === 'draft' && '🟡 Черновик'}
                      {course.status === 'archived' && '🔴 Архив'}
                    </span>
                  </div>
                  
                  <div className="course-stats">
                    <div className="course-stat">
                      <Users size={16} />
                      <span>{course.students} студентов</span>
                    </div>
                    <div className="course-stat">
                      <DollarSign size={16} />
                      <span>{formatCurrency(course.revenue)}</span>
                    </div>
                    <div className="course-stat">
                      <TrendingUp size={16} />
                      <span>{course.completionRate}% завершений</span>
                    </div>
                    <div className="course-stat">
                      <Award size={16} />
                      <span>{course.rating}⭐</span>
                    </div>
                  </div>

                  <div className="course-actions">
                    <button className="btn-secondary">📝 Редактировать</button>
                    <button className="btn-secondary">📊 Аналитика</button>
                    <button className="btn-secondary">👥 Студенты</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'students' && (
          <div className="students-tab">
            <h2>👥 Мои студенты</h2>
            <div className="students-filters">
              <select className="form-select">
                <option value="">Все курсы</option>
                {courses.map(course => (
                  <option key={course.id} value={course.id}>{course.title}</option>
                ))}
              </select>
              <select className="form-select">
                <option value="">Все статусы</option>
                <option value="active">Активные</option>
                <option value="completed">Завершившие</option>
                <option value="inactive">Неактивные</option>
              </select>
            </div>
            
            <div className="students-list">
              {/* Здесь будет список студентов */}
              <p>Список студентов будет загружен...</p>
            </div>
          </div>
        )}

        {activeTab === 'analytics' && (
          <div className="analytics-tab">
            <h2>📊 Детальная аналитика</h2>
            
            <div className="analytics-grid">
              <div className="analytics-card">
                <h3>📈 Доходы по месяцам</h3>
                <div className="chart-placeholder">
                  <p>График доходов</p>
                </div>
              </div>

              <div className="analytics-card">
                <h3>👥 Рост студентов</h3>
                <div className="chart-placeholder">
                  <p>График роста студентов</p>
                </div>
              </div>

              <div className="analytics-card">
                <h3>🎯 Завершение курсов</h3>
                <div className="chart-placeholder">
                  <p>График завершений</p>
                </div>
              </div>

              <div className="analytics-card">
                <h3>⭐ Рейтинги курсов</h3>
                <div className="chart-placeholder">
                  <p>График рейтингов</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
