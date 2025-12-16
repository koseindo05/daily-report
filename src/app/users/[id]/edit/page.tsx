import { UserForm } from '@/components/users/UserForm'

interface Props {
  params: Promise<{ id: string }>
}

export default async function EditUserPage({ params }: Props) {
  const { id } = await params
  return <UserForm userId={id} />
}
