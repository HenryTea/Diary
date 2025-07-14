# 📖 Diary Next.js

A modern, feature-rich diary application built with Next.js 15, featuring a powerful rich text editor with advanced formatting capabilities.

![Next.js](https://img.shields.io/badge/Next.js-15.3.3-000000?style=flat-square&logo=next.js&logoColor=white)
![React](https://img.shields.io/badge/React-19.0.0-61DAFB?style=flat-square&logo=react&logoColor=black)
![TailwindCSS](https://img.shields.io/badge/TailwindCSS-4.0-38B2AC?style=flat-square&logo=tailwind-css&logoColor=white)

## ✨ Features

### 📝 Rich Text Editor
- **Advanced Formatting**: Bold, italic, underline, color picker
- **Font Management**: Google Fonts integration with custom font support
- **Font Size Control**: Preset sizes and custom input
- **Real-time Preview**: WYSIWYG editing experience
- **Auto-save Detection**: Smart dirty state tracking

### 🎨 Customization
- **Custom Fonts**: Add fonts via URL with live preview and persistent storage
- **Color Picker**: Full color customization for text
- **Font Families**: Access to 50+ Google Fonts
- **Recently Used**: Quick access to recently used fonts
- **Font Management**: Remove custom fonts with confirmation dialog

### 🗂️ Entry Management
- **Create Entries**: Rich text editor for new diary entries
- **Edit Entries**: Full editing capabilities for existing entries
- **Delete Entries**: Safe deletion with confirmation
- **Auto-save**: Automatic saving with visual feedback

### 🔧 Technical Features
- **Modular Architecture**: Clean, maintainable component structure
- **Custom Hooks**: Reusable logic with `useRichTextEditor`
- **Utility Functions**: Centralized formatting utilities
- **Responsive Design**: Works on all screen sizes
- **Modern UI**: Clean, intuitive interface

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ 
- npm or yarn

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd diary-nextjs
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start development server**
   ```bash
   npm run dev
   ```

4. **Open your browser**
   ```
   http://localhost:3000
   ```

### Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm run start` | Start production server |
| `npm run lint` | Run ESLint |

## 📁 Project Structure

```
src/
├── app/                    # Next.js App Router
│   ├── api/               # API routes
│   │   └── entries/       # Entry CRUD operations
│   ├── entries/           # Entry pages
│   │   └── [id]/          # Dynamic entry editor
│   ├── globals.css        # Global styles
│   ├── layout.js          # Root layout
│   └── page.js            # Home page
├── components/            # React components
│   ├── editor/            # Rich text editor components
│   │   ├── ColorPicker.jsx
│   │   ├── CustomFontDialog.jsx
│   │   ├── FontSelector.jsx
│   │   ├── FontSizeSelector.jsx
│   │   ├── FormattingToolbar.jsx
│   │   └── TextFormattingButtons.jsx
│   ├── ui/                # UI components
│   │   └── SaveButton.jsx
│   ├── Header.jsx         # App header
│   ├── MainContent.jsx    # Main content area
│   ├── NewEntryButton.jsx # New entry button
│   └── Sidebar.jsx        # Navigation sidebar
├── hooks/                 # Custom React hooks
│   └── useRichTextEditor.js
├── utils/                 # Utility functions
│   └── editorUtils.js
└── db/                    # Database files
    ├── db.csv
    ├── db.js
    └── db.json
```

## 🎯 Component Architecture

### Core Components

#### `FormattingToolbar`
Central toolbar containing all formatting controls:
- Font selection and management
- Font size controls
- Text formatting buttons (bold, italic, underline)
- Color picker

#### `useRichTextEditor` Hook
Custom hook managing all editor state:
- Font and formatting state
- Custom font management
- Editor content handling
- Dirty state tracking

#### `SaveButton`
Smart save button with animated states:
- Shows "Back" when content is unchanged
- Shows "Save" when content is dirty
- Supports custom save text ("Create" vs "Save")

### Editor Components

| Component | Purpose |
|-----------|---------|
| `FontSelector` | Google Fonts dropdown with custom font option |
| `FontSizeSelector` | Preset sizes + custom input |
| `TextFormattingButtons` | Bold, italic, underline controls |
| `ColorPicker` | Color selection for text |
| `CustomFontDialog` | Add custom fonts via URL |

## 🔗 API Routes

### `/api/entries`

| Method | Description | Body |
|--------|-------------|------|
| `GET` | Retrieve all entries | - |
| `POST` | Create new entry | `{ text, isRichText }` |
| `PUT` | Update entry | `{ id, text, isRichText }` |
| `DELETE` | Delete entry | `{ id }` |

## 🎨 Styling

- **Framework**: TailwindCSS 4.0
- **Design**: Custom color scheme with soft blues and greens
- **Typography**: Geist Sans and Geist Mono fonts
- **Responsive**: Mobile-first approach
- **Animations**: Smooth transitions and micro-interactions

### Color Palette
- Primary Background: `#f5fafc`
- Secondary Background: `#e9f3f6`
- Accent: `#b3e6fa`
- Text: Custom black/gray variants

## 🚦 Usage

### Creating a New Entry
1. Click the "NEW" button (floating action button)
2. Use the rich text editor with full formatting capabilities
3. Click "Create and back to Entries" to save

### Editing an Entry
1. Click on any existing entry
2. Edit with the same rich text editor
3. Click "Save and back to Entries" to update

### Formatting Features
- **Bold/Italic/Underline**: Use toolbar buttons
- **Font**: Select from Google Fonts or add custom fonts
- **Font Size**: Choose preset or enter custom size
- **Colors**: Use color picker for text color
- **Custom Fonts**: Add any font via URL

## 🔧 Configuration

### Adding New Fonts
The app supports Google Fonts and custom fonts with persistent storage:

```javascript
// Google Fonts are automatically loaded
const GOOGLE_FONTS = [
  'Arial', 'Georgia', 'Times New Roman',
  'Helvetica', 'Roboto', 'Open Sans',
  // ... more fonts
];

// Custom fonts via URL (stored in localStorage)
const customFont = {
  name: 'Custom Font',
  url: 'https://fonts.googleapis.com/css2?family=CustomFont',
  dateAdded: '2025-06-27T10:00:00.000Z'
};
```

### Font Storage
- **Persistent Storage**: Custom fonts are saved in browser localStorage
- **Auto-reload**: Fonts are automatically reloaded on page refresh
- **Management**: Users can remove custom fonts via dropdown menu
- **Recent Fonts**: Recently used fonts are tracked and persisted

### Database Configuration
Currently uses **JSON file storage** for maximum simplicity and portability:
- **File**: `db/data.json`
- **No external database required**
- **Zero configuration setup**
- **Perfect for development and small deployments**

The JSON database stores:
- Users (authentication)
- Diary entries
- Social features (likes, comments)
- All data in a single file

Can be easily migrated to:
- PostgreSQL
- MongoDB
- Any other database by implementing the same interface

## 🛠️ Development

### Adding New Components
1. Create component in appropriate directory
2. Export from component
3. Import in parent component
4. Add to FormattingToolbar if it's an editor feature

### Modifying Editor Behavior
Main editor logic is in:
- `hooks/useRichTextEditor.js` - State management
- `utils/editorUtils.js` - Formatting utilities

### Styling Guidelines
- Use TailwindCSS classes
- Follow existing color scheme
- Maintain responsive design
- Add hover states for interactive elements

## 📱 Browser Support

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## 🐛 Known Issues

- TypeScript type checking is disabled for build compatibility
- Some Turbopack compatibility issues (use regular Next.js dev server)
- Custom fonts are stored in localStorage (cleared when browser data is cleared)

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make changes following the existing code style
4. Test thoroughly
5. Submit a pull request

## 📄 License

This project is private and not licensed for public use.

## 🙏 Acknowledgments

- Built with [Next.js](https://nextjs.org/)
- Styled with [TailwindCSS](https://tailwindcss.com/)
- Fonts from [Google Fonts](https://fonts.google.com/)
- Icons and UI inspired by modern design principles

---

Made with ❤️ using Next.js and React
