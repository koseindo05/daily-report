import { Layout } from '@/components/layout/Layout'
import { ReportForm } from '@/components/reports'

interface Props {
  params: Promise<{ id: string }>
}

export default async function ReportEditPage({ params }: Props) {
  const { id } = await params

  return (
    <Layout>
      <ReportForm reportId={id} />
    </Layout>
  )
}
