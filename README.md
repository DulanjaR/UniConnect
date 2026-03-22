# UniConnect - University Exclusive Academic Collaboration Platform

A full-stack MERN application designed for university students to collaborate academically, share resources, and manage lost and found items within their campus community.

## 🎯 Features

### Authentication & Authorization
- **JWT-based authentication** with secure token management
- **Two user roles**: Student and Admin
- **Bcrypt password hashing** for secure storage
- **Session management** via localStorage and HTTP-only cookies
- **Profile management** with user information

### Post Management
- **Create, edit, and delete posts** with rich text content
- **Three post categories**: Study, Lost, Found
- **Tag-based topic system** for better organization
- **Search & filter functionality** by category, tag, and keyword
- **Image upload support** via Cloudinary
- **Like/upvote system** for engagement
- **View counter** to track post popularity

### Comments & Engagement
- **Threaded comments** with nested replies
- **Like system** for comments
- **Accepted answer feature** - post owners can mark the best reply
- **Comment moderation** capabilities

### Lost & Found Module
- **Report lost or found items** with detailed descriptions
- **Image attachments** for each listing
- **Category-based filtering** (electronics, documents, accessories, books, clothing, other)
- **Status tracking**: Lost, Found, Resolved
- **Admin moderation** and inappropriate listing removal
- **Comments on items** for coordination

### Admin Dashboard
- **Content moderation** - view and manage all posts and comments
- **User management** - suspend/restore users
- **Activity logging** - comprehensive admin action tracking
- **Dashboard analytics** - stats and insights
- **Item flagging system** for inappropriate content

### Database Collections
1. **Users** - User profiles and authentication
2. **Posts** - Academic posts and discussions
3. **Comments** - Threaded comments and replies
4. **LostItems** - Lost and found item listings
5. **AdminLogs** - Admin action audit trail

## 🛠️ Tech Stack

### Backend
- **Node.js** - JavaScript runtime
- **Express.js** - Web framework
- **MongoDB** - NoSQL database (Atlas)
- **Mongoose** - ODM for MongoDB
- **JWT** - Authentication tokens
- **bcryptjs** - Password hashing
- **Cloudinary** - Image hosting and upload
- **Multer** - File upload middleware

### Frontend
- **React.js** - UI library
- **React Router DOM** - Client-side routing
- **Axios** - HTTP client
- **Tailwind CSS** - Utility-first CSS
- **Vite** - Build tool and dev server
- **Context API** - State management

## 🚀 Getting Started

### Prerequisites
- Node.js (v16+)
- MongoDB Atlas account
- Cloudinary account
- Git

### Installation

#### 1. Clone and Setup

```bash
git clone <repository-url>
cd UniConnect
npm install
```

#### 2. Backend Setup

```bash
cd backend
npm install

# Create .env file
cp .env.example .env

# Edit .env with your configuration
# - MongoDB connection string
# - JWT secret
# - Cloudinary credentials
```

#### 3. Frontend Setup

```bash
cd frontend
npm install

# Create .env file
cp .env.example .env

# Update VITE_API_URL if needed
```

#### 4. Running the Application

**Development Mode** (from root directory):
```bash
npm run dev
```

This starts both backend (port 5000) and frontend (port 5173) concurrently.

**Or run separately:**
```bash
# Terminal 1 - Backend
cd backend
npm run dev

# Terminal 2 - Frontend
cd frontend
npm run dev
```

## 📋 API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/profile` - Get user profile (protected)
- `PUT /api/auth/profile` - Update profile (protected)

### Posts
- `GET /api/posts` - Get all posts with pagination
- `GET /api/posts/feed` - Get personalized feed
- `GET /api/posts/:id` - Get single post
- `GET /api/posts/author/:authorId` - Get posts by author
- `POST /api/posts` - Create post (protected)
- `PUT /api/posts/:id` - Update post (protected)
- `DELETE /api/posts/:id` - Delete post (protected)
- `POST /api/posts/:id/like` - Like/unlike post (protected)

### Comments
- `GET /api/comments/post/:postId` - Get post comments with pagination
- `POST /api/comments` - Create comment (protected)
- `PUT /api/comments/:commentId` - Update comment (protected)
- `DELETE /api/comments/:commentId` - Delete comment (protected)
- `POST /api/comments/:commentId/like` - Like comment (protected)
- `POST /api/comments/:commentId/accept` - Mark as accepted answer (protected)

### Lost Items
- `GET /api/lost-items` - Get all lost/found items
- `GET /api/lost-items/:id` - Get item details
- `POST /api/lost-items` - Create listing (protected)
- `PUT /api/lost-items/:id` - Update listing (protected)
- `DELETE /api/lost-items/:id` - Delete listing (protected)
- `POST /api/lost-items/:id/resolve` - Mark as resolved (protected)
- `POST /api/lost-items/:id/comment` - Add comment (protected)
- `POST /api/lost-items/:id/flag` - Flag inappropriate item (admin only)

### Admin
- `GET /api/admin/dashboard/stats` - Dashboard statistics (admin only)
- `GET /api/admin/posts` - All posts (admin only)
- `GET /api/admin/comments` - All comments (admin only)
- `GET /api/admin/lost-items` - All lost items (admin only)
- `GET /api/admin/users` - All users (admin only)
- `GET /api/admin/logs` - Admin action logs (admin only)
- `POST /api/admin/users/:userId/suspend` - Suspend user (admin only)

## 🎨 Design System

### Color Palette
- **Primary Teal**: `#1B4D6A` - Main brand color
- **Secondary Teal**: `#2c5f7f` - Hover/accent
- **Accent Beige**: `#F5E6C8` - Highlights and CTAs
- **Light Beige**: `#FAF6F0` - Background
- **Dark Text**: `#2d3748` - Primary text

### Typography
- **Font Family**: Inter, system-ui, sans-serif
- **Heading**: Bold, primary teal
- **Body**: Regular, dark text

## 📂 Project Structure

```
UniConnect/
├── backend/
│   ├── src/
│   │   ├── config/
│   │   │   └── db.js
│   │   ├── controllers/
│   │   │   ├── authController.js
│   │   │   ├── postController.js
│   │   │   ├── commentController.js
│   │   │   ├── lostItemController.js
│   │   │   └── adminController.js
│   │   ├── models/
│   │   │   ├── User.js
│   │   │   ├── Post.js
│   │   │   ├── Comment.js
│   │   │   ├── LostItem.js
│   │   │   ├── PostStatus.js
│   │   │   └── AdminLog.js
│   │   ├── routes/
│   │   │   ├── authRoutes.js
│   │   │   ├── postRoutes.js
│   │   │   ├── commentRoutes.js
│   │   │   ├── lostItemRoutes.js
│   │   │   └── adminRoutes.js
│   │   ├── middleware/
│   │   │   └── auth.js
│   │   ├── utils/
│   │   │   └── jwt.js
│   │   └── index.js
│   ├── .env.example
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Navbar.jsx
│   │   │   └── Header.jsx
│   │   ├── context/
│   │   │   └── AuthContext.jsx
│   │   ├── pages/
│   │   │   ├── Home.jsx
│   │   │   ├── Login.jsx
│   │   │   ├── Register.jsx
│   │   │   └── CreatePost.jsx
│   │   ├── services/
│   │   │   └── api.js
│   │   ├── App.jsx
│   │   ├── main.jsx
│   │   └── index.css
│   ├── .env.example
│   ├── tailwind.config.js
│   ├── postcss.config.js
│   ├── vite.config.mts
│   └── package.json
├── package.json
└── README.md
```

## 🔐 Security Features

- JWT token-based authentication
- Bcrypt password hashing with salt
- Protected API routes with auth middleware
- Admin-only endpoints
- User input validation
- CORS configuration
- HTTP-only cookie support for tokens

## 🚧 In Development / Future Features

- [ ] Post detail page with comments
- [ ] Lost & Found listing pages and detailed views
- [ ] Admin dashboard UI components
- [ ] Image upload functionality with Cloudinary
- [ ] User profile pages
- [ ] Advanced search and filtering
- [ ] Email notifications
- [ ] User dashboard with my posts/items
- [ ] Report inappropriate content feature
- [ ] Real-time notifications with Socket.io

## 📝 Usage Examples

### Create a Post
```bash
POST /api/posts
Authorization: Bearer <token>
Content-Type: application/json

{
  "title": "Best resources for Data Structures",
  "body": "Here are the resources I found helpful...",
  "tags": ["dsa", "learning", "resources"],
  "category": "study"
}
```

### Report a Lost Item
```bash
POST /api/lost-items
Authorization: Bearer <token>
Content-Type: application/json

{
  "title": "Lost Blue Backpack",
  "description": "A blue Adidas backpack lost near the library",
  "category": "accessories",
  "itemType": "lost",
  "location": "Central Library",
  "dateOfIncident": "2024-03-20",
  "contactEmail": "user@university.edu",
  "contactPhone": "+1234567890"
}
```

## 🤝 Contributing

Contributions are welcome! Please follow these steps:
1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit changes (`git commit -m 'Add AmazingFeature'`)
4. Push branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see LICENSE file for details.

## 📞 Support

For issues and questions, please open an issue on GitHub or contact the development team.

## 🙏 Acknowledgments

- MongoDB Atlas for database hosting
- Cloudinary for image management
- Tailwind CSS for styling utilities
- The open-source community for tools and libraries
