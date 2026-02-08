# Maktabati - PDF Library Organizer

Maktabati is a professional desktop application built with Electron and React for organizing and viewing your PDF library.

## Project Structure

This project follows professional software engineering standards:

- **`client/`**: React frontend source code.
- **`electron/`**: Electron main process and integration code.
- **`server/`**: Backend API and storage logic.
- **`shared/`**: Shared types and utilities.
- **`public/`**: Static assets.
- **`Build.bat`**: Professional build script for generating the desktop application.

---

## 🚀 For Non-Developers (How to use)

If you just want to use the application:

1. **Build the app**: Double-click on `Build.bat`.
2. **Locate the app**: Once finished, a folder named `release` will be created.
3. **Run**: Open the `release` folder and run `Library.exe`.
4. **Share**: To share the app with others, simply Zip the `release` folder and send it.

---

## 💻 For Developers

### Prerequisites

- Node.js (v18 or higher)
- npm

### Setup

1. Install dependencies:
   ```bash
   npm install
   ```

### Development

Start the development server with live reload:

```bash
npm run dev
```

### Building

To build the professional portable version:

```bash
npm run electron:build
```

Or simply use the provided `Build.bat`.

---

_Created with ❤️ for personal use and professional management._
