import React from 'react'
import { Link } from 'react-router-dom'
import { HomeIcon, BookOpenIcon, ArrowLeftIcon } from '@heroicons/react/24/outline'

const NotFoundPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-secondary-50 flex items-center justify-center">
      <div className="text-center max-w-md mx-auto px-4">
        <div className="text-8xl mb-8">🤔</div>
        
        <h1 className="text-4xl md:text-6xl font-bold text-secondary-900 mb-4">
          404
        </h1>
        
        <h2 className="text-xl md:text-2xl font-semibold text-secondary-700 mb-4">
          Страница не найдена
        </h2>
        
        <p className="text-secondary-600 mb-8">
          К сожалению, запрашиваемая страница не существует или была перемещена.
        </p>
        
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link to="/" className="btn-primary">
            <HomeIcon className="mr-2 h-4 w-4" />
            На главную
          </Link>
          
          <Link to="/courses" className="btn-outline">
            <BookOpenIcon className="mr-2 h-4 w-4" />
            К курсам
          </Link>
          
          <button onClick={() => window.history.back()} className="btn-ghost">
            <ArrowLeftIcon className="mr-2 h-4 w-4" />
            Назад
          </button>
        </div>
      </div>
    </div>
  )
}

export default NotFoundPage
