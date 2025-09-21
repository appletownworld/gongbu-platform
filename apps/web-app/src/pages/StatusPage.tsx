import React, { useEffect, useState } from 'react';
import { 
  CheckCircleIcon, 
  ExclamationTriangleIcon, 
  XCircleIcon,
  ArrowPathIcon,
  ClockIcon,
  ServerIcon,
  GlobeAltIcon,
  CloudIcon,
  ChatBubbleLeftEllipsisIcon
} from '@heroicons/react/24/outline';

interface ServiceStatus {
  name: string;
  status: 'operational' | 'degraded' | 'outage';
  uptime: string;
  responseTime: string;
  description: string;
}

const StatusPage: React.FC = () => {
  const [lastUpdated, setLastUpdated] = useState(new Date());
  const [isLoading, setIsLoading] = useState(false);

  // Simulated service statuses
  const [services, setServices] = useState<ServiceStatus[]>([
    {
      name: 'Веб-платформа',
      status: 'operational',
      uptime: '99.9%',
      responseTime: '142ms',
      description: 'Основной сайт и веб-интерфейс'
    },
    {
      name: 'Telegram Bot',
      status: 'operational', 
      uptime: '99.8%',
      responseTime: '89ms',
      description: 'Telegram бот для регистрации и уведомлений'
    },
    {
      name: 'API Сервисы',
      status: 'operational',
      uptime: '99.9%',
      responseTime: '76ms',
      description: 'Backend API для курсов и авторизации'
    },
    {
      name: 'База данных',
      status: 'operational',
      uptime: '100%',
      responseTime: '12ms',
      description: 'Хранение данных пользователей и курсов'
    },
    {
      name: 'Видео стриминг',
      status: 'degraded',
      uptime: '98.2%', 
      responseTime: '320ms',
      description: 'Доставка видео контента и материалов'
    },
    {
      name: 'Система уведомлений',
      status: 'operational',
      uptime: '99.7%',
      responseTime: '156ms',
      description: 'Email и push уведомления'
    }
  ]);

  const refreshStatus = async () => {
    setIsLoading(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    setLastUpdated(new Date());
    setIsLoading(false);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'operational':
        return <CheckCircleIcon className="h-6 w-6 text-green-500" />;
      case 'degraded':
        return <ExclamationTriangleIcon className="h-6 w-6 text-yellow-500" />;
      case 'outage':
        return <XCircleIcon className="h-6 w-6 text-red-500" />;
      default:
        return <ClockIcon className="h-6 w-6 text-gray-500" />;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'operational':
        return { text: 'Работает', color: 'text-green-600' };
      case 'degraded':
        return { text: 'Замедлено', color: 'text-yellow-600' };
      case 'outage':
        return { text: 'Недоступен', color: 'text-red-600' };
      default:
        return { text: 'Неизвестно', color: 'text-gray-600' };
    }
  };

  const getOverallStatus = () => {
    const hasOutage = services.some(s => s.status === 'outage');
    const hasDegraded = services.some(s => s.status === 'degraded');
    
    if (hasOutage) return { status: 'outage', text: 'Серьезные проблемы', color: 'text-red-600' };
    if (hasDegraded) return { status: 'degraded', text: 'Частичные проблемы', color: 'text-yellow-600' };
    return { status: 'operational', text: 'Все системы работают', color: 'text-green-600' };
  };

  const overallStatus = getOverallStatus();
  const operationalCount = services.filter(s => s.status === 'operational').length;

  const incidents = [
    {
      id: 1,
      title: 'Замедление загрузки видео',
      status: 'investigating',
      started: '2 часа назад',
      description: 'Мы расследуем сообщения о медленной загрузке видео в некоторых курсах.',
      updates: [
        { time: '10:30', text: 'Проблема идентифицирована. Работаем над исправлением.' },
        { time: '10:15', text: 'Получены первые сообщения о проблеме.' }
      ]
    }
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setLastUpdated(new Date());
    }, 30000); // Update every 30 seconds

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 text-secondary-900">
      {/* Hero Section */}
      <section className="relative py-20 md:py-32 text-center bg-white shadow-sm">
        <div className="container mx-auto px-6 max-w-4xl">
          <div className="flex items-center justify-center mb-6">
            {getStatusIcon(overallStatus.status)}
            <h1 className="text-4xl md:text-6xl font-extrabold text-primary-700 ml-4">
              Статус <span className="text-accent-500">системы</span>
            </h1>
          </div>
          
          <p className={`text-lg md:text-xl mb-4 ${overallStatus.color} font-semibold`}>
            {overallStatus.text}
          </p>
          
          <p className="text-secondary-600 mb-8">
            {operationalCount} из {services.length} сервисов работают нормально
          </p>
          
          <div className="flex items-center justify-center text-sm text-secondary-500">
            <ClockIcon className="h-4 w-4 mr-2" />
            Последнее обновление: {lastUpdated.toLocaleTimeString('ru-RU')}
            <button
              onClick={refreshStatus}
              disabled={isLoading}
              className="ml-4 p-1 hover:bg-secondary-100 rounded-full transition-colors"
            >
              <ArrowPathIcon className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>
      </section>

      {/* Services Status */}
      <section className="py-16 md:py-24 bg-white">
        <div className="container mx-auto px-6 max-w-6xl">
          <h2 className="text-3xl md:text-4xl font-bold text-secondary-800 mb-12 text-center">
            Состояние сервисов
          </h2>
          
          <div className="space-y-4">
            {services.map((service, index) => {
              const statusInfo = getStatusText(service.status);
              return (
                <div key={index} className="bg-white border border-secondary-200 rounded-lg p-6 hover:shadow-md transition-shadow">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center flex-1">
                      <div className="mr-4">
                        {service.name === 'Веб-платформа' && <GlobeAltIcon className="h-6 w-6 text-blue-500" />}
                        {service.name === 'Telegram Bot' && <ChatBubbleLeftEllipsisIcon className="h-6 w-6 text-green-500" />}
                        {service.name === 'API Сервисы' && <ServerIcon className="h-6 w-6 text-purple-500" />}
                        {service.name === 'База данных' && <ServerIcon className="h-6 w-6 text-indigo-500" />}
                        {service.name === 'Видео стриминг' && <CloudIcon className="h-6 w-6 text-orange-500" />}
                        {service.name === 'Система уведомлений' && <CloudIcon className="h-6 w-6 text-pink-500" />}
                      </div>
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-secondary-800">{service.name}</h3>
                        <p className="text-sm text-secondary-600">{service.description}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-8 text-sm">
                      <div className="text-center">
                        <div className="text-secondary-500">Время отклика</div>
                        <div className="font-semibold text-secondary-800">{service.responseTime}</div>
                      </div>
                      <div className="text-center">
                        <div className="text-secondary-500">Uptime</div>
                        <div className="font-semibold text-secondary-800">{service.uptime}</div>
                      </div>
                      <div className="flex items-center">
                        {getStatusIcon(service.status)}
                        <span className={`ml-2 font-semibold ${statusInfo.color}`}>
                          {statusInfo.text}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Recent Incidents */}
      {incidents.length > 0 && (
        <section className="py-16 md:py-24 bg-secondary-50">
          <div className="container mx-auto px-6 max-w-6xl">
            <h2 className="text-3xl md:text-4xl font-bold text-secondary-800 mb-12 text-center">
              Недавние инциденты
            </h2>
            
            <div className="space-y-6">
              {incidents.map((incident) => (
                <div key={incident.id} className="bg-white border border-secondary-200 rounded-lg p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="text-xl font-semibold text-secondary-800">{incident.title}</h3>
                      <p className="text-sm text-secondary-600">{incident.description}</p>
                    </div>
                    <div className="text-right">
                      <div className="px-3 py-1 bg-yellow-100 text-yellow-800 text-sm rounded-full font-medium">
                        Расследуется
                      </div>
                      <div className="text-sm text-secondary-500 mt-1">
                        Начато {incident.started}
                      </div>
                    </div>
                  </div>
                  
                  <div className="border-l-2 border-secondary-200 pl-4 ml-2">
                    {incident.updates.map((update, index) => (
                      <div key={index} className="mb-3 last:mb-0">
                        <div className="flex items-center text-sm text-secondary-500 mb-1">
                          <ClockIcon className="h-4 w-4 mr-1" />
                          {update.time}
                        </div>
                        <p className="text-secondary-700">{update.text}</p>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Metrics */}
      <section className="py-16 md:py-24 bg-white">
        <div className="container mx-auto px-6 max-w-6xl">
          <h2 className="text-3xl md:text-4xl font-bold text-secondary-800 mb-12 text-center">
            Статистика за 30 дней
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="bg-green-50 rounded-lg p-6 text-center border border-green-200">
              <div className="text-3xl font-bold text-green-700 mb-2">99.9%</div>
              <div className="text-sm text-green-600 font-medium">Общий Uptime</div>
            </div>
            <div className="bg-blue-50 rounded-lg p-6 text-center border border-blue-200">
              <div className="text-3xl font-bold text-blue-700 mb-2">89ms</div>
              <div className="text-sm text-blue-600 font-medium">Среднее время отклика</div>
            </div>
            <div className="bg-purple-50 rounded-lg p-6 text-center border border-purple-200">
              <div className="text-3xl font-bold text-purple-700 mb-2">2</div>
              <div className="text-sm text-purple-600 font-medium">Инцидентов за месяц</div>
            </div>
            <div className="bg-orange-50 rounded-lg p-6 text-center border border-orange-200">
              <div className="text-3xl font-bold text-orange-700 mb-2">4m</div>
              <div className="text-sm text-orange-600 font-medium">Среднее время решения</div>
            </div>
          </div>
        </div>
      </section>

      {/* Subscribe to Updates */}
      <section className="py-16 md:py-24 bg-secondary-900 text-white">
        <div className="container mx-auto px-6 max-w-4xl text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">
            Подписка на обновления
          </h2>
          <p className="text-lg text-secondary-300 mb-8">
            Получайте уведомления о статусе системы и плановых работах
          </p>
          <div className="flex flex-col sm:flex-row gap-4 max-w-md mx-auto">
            <input
              type="email"
              placeholder="Ваш email"
              className="flex-1 px-4 py-2 bg-secondary-800 border border-secondary-700 rounded-lg text-white placeholder-secondary-400 focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
            <button className="btn-primary whitespace-nowrap">
              Подписаться
            </button>
          </div>
          
          <div className="mt-8 text-center">
            <p className="text-secondary-400 text-sm mb-4">
              Или следите за обновлениями в наших соцсетях:
            </p>
            <div className="flex justify-center space-x-4">
              <a href="https://t.me/gongbu_status" className="text-secondary-300 hover:text-white transition-colors">
                📱 Telegram
              </a>
              <a href="https://twitter.com/gongbu_status" className="text-secondary-300 hover:text-white transition-colors">
                🐦 Twitter
              </a>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default StatusPage;
