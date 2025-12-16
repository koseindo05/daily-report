import { UserForm } from '@/components/users/UserForm'

export default function EditUserPage({ params }: { params: { id: string } }) {
  return <UserForm userId={params.id} />
}
