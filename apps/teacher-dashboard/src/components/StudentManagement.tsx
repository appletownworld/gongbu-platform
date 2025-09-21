import React, { useState, useEffect } from 'react';
import { 
  Search, 
  Filter, 
  Mail, 
  MessageSquare, 
  Award, 
  Clock,
  TrendingUp,
  MoreVertical,
  UserCheck,
  UserX
} from 'lucide-react';

interface Student {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  enrolledAt: string;
  lastActivity: string;
  progress: number;
  status: 'active' | 'completed' | 'inactive' | 'dropped';
  courses: {
    courseId: string;
    courseTitle: string;
    progress: number;
    completedAt?: string;
  }[];
  totalSpent: number;
  rating?: number;
  notes?: string;
}

interface StudentManagementProps {
  courseId?: string;
}

export const StudentManagement: React.FC<StudentManagementProps> = ({ courseId }) => {
  const [students, setStudents] = useState<Student[]>([]);
  const [filteredStudents, setFilteredStudents] = useState<Student[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [sortBy, setSortBy] = useState<'name' | 'progress' | 'enrolledAt' | 'lastActivity'>('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [selectedStudents, setSelectedStudents] = useState<string[]>([]);

  useEffect(() => {
    loadStudents();
  }, [courseId]);

  useEffect(() => {
    filterAndSortStudents();
  }, [students, searchTerm, statusFilter, sortBy, sortOrder]);

  const loadStudents = async () => {
    try {
      setIsLoading(true);
      
      const url = courseId 
        ? `/api/teacher/courses/${courseId}/students`
        : '/api/teacher/students';
      
      const response = await fetch(url);
      const data = await response.json();
      
      setStudents(data);
    } catch (error) {
      console.error('Ошибка загрузки студентов:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const filterAndSortStudents = () => {
    let filtered = [...students];

    // Фильтрация по поисковому запросу
    if (searchTerm) {
      filtered = filtered.filter(student =>
        student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        student.email.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Фильтрация по статусу
    if (statusFilter) {
      filtered = filtered.filter(student => student.status === statusFilter);
    }

    // Сортировка
    filtered.sort((a, b) => {
      let aValue: any, bValue: any;

      switch (sortBy) {
        case 'name':
          aValue = a.name.toLowerCase();
          bValue = b.name.toLowerCase();
          break;
        case 'progress':
          aValue = a.progress;
          bValue = b.progress;
          break;
        case 'enrolledAt':
          aValue = new Date(a.enrolledAt).getTime();
          bValue = new Date(b.enrolledAt).getTime();
          break;
        case 'lastActivity':
          aValue = new Date(a.lastActivity).getTime();
          bValue = new Date(b.lastActivity).getTime();
          break;
        default:
          aValue = a.name.toLowerCase();
          bValue = b.name.toLowerCase();
      }

      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

    setFilteredStudents(filtered);
  };

  const handleSelectStudent = (studentId: string) => {
    setSelectedStudents(prev =>
      prev.includes(studentId)
        ? prev.filter(id => id !== studentId)
        : [...prev, studentId]
    );
  };

  const handleSelectAll = () => {
    if (selectedStudents.length === filteredStudents.length) {
      setSelectedStudents([]);
    } else {
      setSelectedStudents(filteredStudents.map(s => s.id));
    }
  };

  const sendBulkMessage = async () => {
    if (selectedStudents.length === 0) return;

    const message = prompt('Введите сообщение для отправки:');
    if (!message) return;

    try {
      await fetch('/api/teacher/students/bulk-message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentIds: selectedStudents,
          message,
        }),
      });

      alert('Сообщения отправлены!');
      setSelectedStudents([]);
    } catch (error) {
      console.error('Ошибка отправки сообщений:', error);
      alert('Ошибка отправки сообщений');
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ru-RU', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ru-RU', {
      style: 'currency',
      currency: 'RUB',
    }).format(amount);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'text-green-600 bg-green-100';
      case 'completed': return 'text-blue-600 bg-blue-100';
      case 'inactive': return 'text-yellow-600 bg-yellow-100';
      case 'dropped': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'active': return '🟢 Активен';
      case 'completed': return '✅ Завершил';
      case 'inactive': return '🟡 Неактивен';
      case 'dropped': return '🔴 Бросил';
      default: return '❓ Неизвестно';
    }
  };

  if (isLoading) {
    return (
      <div className="students-loading">
        <div className="loading-spinner"></div>
        <p>Загрузка студентов...</p>
      </div>
    );
  }

  return (
    <div className="student-management">
      <div className="students-header">
        <h2>👥 Управление студентами</h2>
        <div className="header-actions">
          {selectedStudents.length > 0 && (
            <button onClick={sendBulkMessage} className="btn-primary">
              <Mail size={16} />
              Отправить сообщение ({selectedStudents.length})
            </button>
          )}
        </div>
      </div>

      <div className="students-filters">
        <div className="search-box">
          <Search size={20} />
          <input
            type="text"
            placeholder="Поиск по имени или email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
        </div>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="form-select"
        >
          <option value="">Все статусы</option>
          <option value="active">Активные</option>
          <option value="completed">Завершившие</option>
          <option value="inactive">Неактивные</option>
          <option value="dropped">Бросившие</option>
        </select>

        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value as any)}
          className="form-select"
        >
          <option value="name">По имени</option>
          <option value="progress">По прогрессу</option>
          <option value="enrolledAt">По дате записи</option>
          <option value="lastActivity">По последней активности</option>
        </select>

        <button
          onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
          className="btn-secondary"
        >
          {sortOrder === 'asc' ? '↑' : '↓'}
        </button>
      </div>

      <div className="students-stats">
        <div className="stat-item">
          <span className="stat-label">Всего студентов:</span>
          <span className="stat-value">{students.length}</span>
        </div>
        <div className="stat-item">
          <span className="stat-label">Активных:</span>
          <span className="stat-value">{students.filter(s => s.status === 'active').length}</span>
        </div>
        <div className="stat-item">
          <span className="stat-label">Завершивших:</span>
          <span className="stat-value">{students.filter(s => s.status === 'completed').length}</span>
        </div>
        <div className="stat-item">
          <span className="stat-label">Средний прогресс:</span>
          <span className="stat-value">
            {Math.round(students.reduce((sum, s) => sum + s.progress, 0) / students.length)}%
          </span>
        </div>
      </div>

      <div className="students-table">
        <div className="table-header">
          <div className="table-cell checkbox">
            <input
              type="checkbox"
              checked={selectedStudents.length === filteredStudents.length && filteredStudents.length > 0}
              onChange={handleSelectAll}
            />
          </div>
          <div className="table-cell">Студент</div>
          <div className="table-cell">Статус</div>
          <div className="table-cell">Прогресс</div>
          <div className="table-cell">Последняя активность</div>
          <div className="table-cell">Потрачено</div>
          <div className="table-cell">Действия</div>
        </div>

        {filteredStudents.map((student) => (
          <div key={student.id} className="table-row">
            <div className="table-cell checkbox">
              <input
                type="checkbox"
                checked={selectedStudents.includes(student.id)}
                onChange={() => handleSelectStudent(student.id)}
              />
            </div>

            <div className="table-cell student-info">
              <div className="student-avatar">
                {student.avatar ? (
                  <img src={student.avatar} alt={student.name} />
                ) : (
                  <span>{student.name.charAt(0).toUpperCase()}</span>
                )}
              </div>
              <div className="student-details">
                <div className="student-name">{student.name}</div>
                <div className="student-email">{student.email}</div>
                <div className="student-enrolled">
                  Записался: {formatDate(student.enrolledAt)}
                </div>
              </div>
            </div>

            <div className="table-cell">
              <span className={`status-badge ${getStatusColor(student.status)}`}>
                {getStatusText(student.status)}
              </span>
            </div>

            <div className="table-cell">
              <div className="progress-container">
                <div className="progress-bar">
                  <div 
                    className="progress-fill" 
                    style={{ width: `${student.progress}%` }}
                  ></div>
                </div>
                <span className="progress-text">{student.progress}%</span>
              </div>
            </div>

            <div className="table-cell">
              <div className="last-activity">
                <Clock size={14} />
                <span>{formatDate(student.lastActivity)}</span>
              </div>
            </div>

            <div className="table-cell">
              <div className="spent-amount">
                {formatCurrency(student.totalSpent)}
              </div>
            </div>

            <div className="table-cell actions">
              <div className="action-buttons">
                <button className="btn-icon" title="Написать сообщение">
                  <MessageSquare size={16} />
                </button>
                <button className="btn-icon" title="Отправить email">
                  <Mail size={16} />
                </button>
                <button className="btn-icon" title="Подробнее">
                  <MoreVertical size={16} />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredStudents.length === 0 && (
        <div className="no-students">
          <p>Студенты не найдены</p>
        </div>
      )}
    </div>
  );
};
