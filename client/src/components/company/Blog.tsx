import { Calendar, Clock, User, ArrowRight, TrendingUp, BookOpen, MessageSquare } from "lucide-react";

interface BlogPost {
  id: number;
  title: string;
  excerpt: string;
  date: string;
  author: string;
  readTime: string;
  category: string;
}

function BlogCard({ post }: { post: BlogPost }) {
  return (
    <div className="bg-gradient-to-br from-white to-gray-50 dark:from-gray-900 dark:to-gray-800 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 p-6 h-full flex flex-col border border-gray-100 dark:border-gray-700 group">
      <div className="flex items-start space-x-4 mb-4">
        <div className="w-12 h-12 bg-gradient-to-br from-[#29A378] to-[#119e6c] dark:from-[#1a3a3a] dark:to-[#0f172a] rounded-2xl flex items-center justify-center flex-shrink-0 shadow-lg group-hover:scale-105 transition-transform duration-300">
          <BookOpen className="w-6 h-6 text-white dark:text-gray-200" />
        </div>
        <div className="flex-1">
          <span className="inline-block px-3 py-1 bg-gradient-to-r from-[#29A378] to-[#119e6c] dark:from-[#1a3a3a] dark:to-[#0f172a] text-white text-xs font-medium rounded-full shadow-sm group-hover:text-[#29A378] group-hover:translate-x-1 transition-all duration-300">
            {post.category}
          </span>
          <h3 className="text-lg font-semibold mb-2 text-foreground group-hover:text-[#29A378] transition-colors duration-300">{post.title}</h3>
          <p className="text-gray-600 dark:text-gray-300 mb-6 leading-relaxed flex-grow text-sm md:text-base">{post.excerpt}</p>
          
          <div className="flex flex-wrap items-center gap-4 text-xs md:text-sm text-gray-500 dark:text-gray-400 mb-4">
            <div className="flex items-center space-x-1">
              <Calendar className="w-3 h-3 md:w-4 md:h-4" />
              <span>{post.date}</span>
            </div>
            
            <div className="flex items-center space-x-1">
              <Clock className="w-3 h-3 md:w-4 md:h-4" />
              <span>{post.readTime}</span>
            </div>
            
            <div className="flex items-center space-x-1">
              <User className="w-3 h-3 md:w-4 md:h-4" />
              <span>{post.author}</span>
            </div>
          </div>
          
          <div className="mt-auto">
            <button className="text-[#29A378] hover:text-[#119e6c] font-medium flex items-center text-sm md:text-base group-hover:translate-x-1 transition-all duration-300">
              Read More
              <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform duration-300" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Blog() {
  const blogPosts: BlogPost[] = [
    {
      id: 1,
      title: "5 Ways GrwoFinance Simplifies Nigerian Tax Compliance",
      excerpt: "Discover how our platform automates VAT calculations, WHT deductions, and generates FIRS-compliant reports for Nigerian businesses.",
      date: "Nov 15, 2024",
      author: "GrwoFinance Team",
      readTime: "5 min read",
      category: "Tax Tips"
    },
    {
      id: 2,
      title: "The Future of Digital Banking in Nigeria",
      excerpt: "Exploring emerging trends and technologies shaping Nigeria's financial landscape and how GrwoFinance is leading the digital transformation.",
      date: "Nov 10, 2024",
      author: "Sarah Johnson",
      readTime: "8 min read",
      category: "Industry Insights"
    },
    {
      id: 3,
      title: "Managing Multiple Business Accounts Made Easy",
      excerpt: "Learn how to efficiently manage multiple business entities, track expenses across accounts, and generate consolidated financial reports.",
      date: "Nov 5, 2024",
      author: "Michael Okafor",
      readTime: "6 min read",
      category: "How-to Guides"
    }
  ];

  return (
    <div className="bg-gradient-to-br from-white to-gray-50 rounded-3xl shadow-xl p-6 md:p-10 border border-gray-100">
      <div className="flex items-center mb-8">
        <div className="w-12 h-12 md:w-16 md:h-16 bg-gradient-to-br from-[#29A378] to-[#119e6c] rounded-2xl flex items-center justify-center mr-4 md:mr-6 shadow-lg">
          <MessageSquare className="w-6 h-6 md:w-8 md:h-8 text-white" />
        </div>
        <div>
          <h3 className="text-2xl md:text-3xl font-bold text-foreground mb-2">Latest Blog Posts</h3>
          <p className="text-sm md:text-base text-gray-600">Insights, tips, and updates for Nigerian businesses</p>
        </div>
      </div>
      
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8 mb-8">
        {blogPosts.map((post) => (
          <BlogCard key={post.id} post={post} />
        ))}
      </div>
      
      <div className="text-center">
        <button className="bg-gradient-to-r from-[#29A378] to-[#119e6c] text-white hover:from-[#29A378]/90 hover:to-[#119e6c]/90 px-6 md:px-8 py-3 rounded-xl font-medium shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105">
          View All Blog Posts
          <ArrowRight className="w-4 h-4 ml-2 inline" />
        </button>
      </div>
    </div>
  );
}
