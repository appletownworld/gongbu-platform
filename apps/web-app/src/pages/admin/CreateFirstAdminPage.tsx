import React from 'react'
import { useNavigate } from 'react-router-dom'
import CreateFirstAdmin from '@/components/admin/CreateFirstAdmin'

const CreateFirstAdminPage: React.FC = () => {
  const navigate = useNavigate()

  const handleSuccess = () => {
    // После успешного создания админа перенаправляем на админ панель
    navigate('/admin')
  }

  return <CreateFirstAdmin onSuccess={handleSuccess} />
}

export default CreateFirstAdminPage
