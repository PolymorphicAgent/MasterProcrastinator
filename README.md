# Master Procrastinator
A simple, client-side task manager with file attachments and drag-and-drop reordering. Your data is stored locally in your browser using IndexedDB and LocalStorage, so it never leaves your device!

## Warnings
1. Since this project is entirely client-side, your data is stored in your browser. If you clear your browser data or switch browsers/devices, you will lose your tasks and attachments unless you export them first. Always back up your data by exporting your task list as a JSON file.

2. It is strongly recommended to not attach  excessively large files, as they will be copied to your browser's IndexedDB. This may lead to disk space issues.

## Features
- Add, edit, and delete tasks
- Attach files to tasks (images, documents, etc.)
- Set due date for tasks
- Drag-and-drop to reorder tasks
- Mark tasks as completed and view them in a separate section
- Search tasks by title or description
- Color-code tasks
- Import and export lists as JSON files for backup and/or transfer
- Preference to toggle autosaving of attachments
- Preference for light/dark mode
- Fully client-side, so your data never gets sent over the internet

## Usage
Access the site [https://todo.polimorph.dev](https://todo.polimorph.dev). All data is stored locally in your browser.

- Click `Add Task` to create a new task. You can attach files if desired

- Click `Edit` on a task to edit it

- Click `Duplicate` on a task to create a copy of it

- Click `Delete` on a task to remove it

- Click the checkbox next to a task to mark it as completed. Completed tasks will move to the `Completed Tasks` section

- Use the search bar to filter tasks

## Easter Eggs
- There are a couple...

## Development
- To open the project locally, clone the repository and open `index.html` in a web browser. For development, it's recommended to use a local server (e.g., using the Live Server extension in VSCode, or python `python3 -m http.server 8080`) to avoid CORS issues with IndexedDB.