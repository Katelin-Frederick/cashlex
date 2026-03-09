import { auth, } from '~/server/auth'

import { DashboardClient, } from './_components/dashboard-client'

const DashboardPage = async () => {
  const session = await auth()
  const userName = session?.user?.name ?? session?.user?.email ?? 'there'

  return <DashboardClient userName={userName} />
}

export default DashboardPage
