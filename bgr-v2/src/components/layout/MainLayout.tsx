import { Header } from './Header'
import { Footer } from './Footer'
import { Container } from './Container'

interface MainLayoutProps {
  children: React.ReactNode
  containerSize?: 'sm' | 'md' | 'lg' | 'xl' | 'full'
  showContainer?: boolean
}

export function MainLayout({ 
  children, 
  containerSize = 'lg', 
  showContainer = true 
}: MainLayoutProps) {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <main className="flex-1">
        {showContainer ? (
          <Container size={containerSize}>
            {children}
          </Container>
        ) : (
          children
        )}
      </main>
      
      <Footer />
    </div>
  )
}