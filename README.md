# Master Procrastinator
A simple, client-side task manager with file attachments and drag-and-drop reordering. Your data is stored locally in your browser using IndexedDB and LocalStorage, so it never leaves your device!

## Warnings
1. Since this project is entirely client-side, your data is stored in your browser. If you clear your browser data or switch browsers/devices, you will lose your tasks and attachments unless you export them first. Always back up your data by exporting your task list as a JSON file.

2. It is strongly recommended to not attach  excessively large files, as they will be copied to your browser's IndexedDB. This may lead to disk space issues.

## Features
- Add, edit, and delete tasks
- Attach files to tasks (images, documents, etc.)
- Drag-and-drop to reorder tasks
- Mark tasks as completed and view them in a separate section
- Search tasks by title or description
- Color-code tasks
- Import and export lists as JSON files for backup and/or transfer
- Preference to toggle autosaving of attachments
- Preference for light/dark mode
- Progress bar to visualize task completion
- Fully client-side, so your data never gets sent over the internet

## Usage
Access the site ([https://todo.polimorph.dev](https://todo.polimorph.dev)). All data is stored locally in your browser.

- Click "Add Task" to create a new task. You can attach files if desired

- Click "Edit" on a task to edit it or change its attachments

- 