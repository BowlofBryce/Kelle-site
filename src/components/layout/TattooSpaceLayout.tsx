import { Outlet } from 'react-router-dom';
import { motion } from 'framer-motion';
import { NavBar } from './NavBar';
import { MySpaceSidebar } from './MySpaceSidebar';
import { Footer } from './Footer';

export function TattooSpaceLayout() {
  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_#1a1a1a,_#050505)] text-gray-100">
      <NavBar />

      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="flex gap-6">
          <MySpaceSidebar />

          <motion.main
            className="flex-1 min-w-0"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ type: 'spring', stiffness: 60, damping: 18 }}
          >
            <Outlet />
          </motion.main>
        </div>

        <Footer />
      </div>

    </div>
  );
}
