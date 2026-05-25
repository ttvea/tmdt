import Navbar from '../../layouts/Navbar'
import Footer from '../../layouts/Footer'
import { ConversationsList } from '../../components/ConversationsList'

export function TutorConversations() {
  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />

      {/* Hero Section */}
      <section className="bg-slate-900 text-white text-center py-12">
        <div className="container mx-auto px-4">
          <h1 className="text-4xl font-bold mb-3">💬 Hội thoại</h1>
          <p className="text-slate-300">Quản lý các cuộc trò chuyện với học viên</p>
        </div>
      </section>

      {/* Main Content */}
      <section className="flex-1 py-8">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
            {/* Conversations List */}
            <div className="lg:col-span-1">
              <div className="bg-white p-6 rounded-lg border border-slate-200">
                <h2 className="text-xl font-bold mb-4">Danh sách hội thoại</h2>
                <ConversationsList />
              </div>
            </div>

            {/* Chat Detail - Placeholder */}
            <div className="lg:col-span-2">
              <div className="bg-white p-6 rounded-lg border border-slate-200 h-96 flex items-center justify-center">
                <div className="text-center">
                  <div className="text-4xl mb-3">💭</div>
                  <p className="text-slate-600">Chọn một hội thoại từ danh sách</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  )
}
