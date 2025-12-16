import { CustomerForm } from '@/components/customers/CustomerForm'

interface Props {
  params: Promise<{
    id: string
  }>
}

export default async function EditCustomerPage({ params }: Props) {
  const { id } = await params
  return <CustomerForm customerId={id} />
}
