import { Layout } from '@/components/layout/Layout'
import { ReportDetail } from '@/components/reports'

interface Props {
  params: Promise<{ id: string }>
}

export default async function ReportDetailPage({ params }: Props) {
  const { id } = await params

  return (
    <Layout>
      <ReportDetail reportId={id} />
    </Layout>
  )
}
