# Master Procrastinator
A completely client-side task manager. Your data is stored locally in your browser, so it never leaves your device!


## Warnings
1. Because your data is stored in your browser, <u>**if you clear your browser data or switch browsers/devices, you will lose your tasks and attachments.**</u> If you plan on clearing your browser history, you can export your task list (including attachments) to a file that can be re-imported later.


2. It is strongly recommended to <u>**refrain from attaching excessively large files**</u>, as they will be copied to your browser's storage. This may lead to disk space and performance issues. You may add google drive (or whichever service you use) links to a task's description as an alternative.


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

- **Fully client-side, so your data never gets sent over the internet**

## Usage
Access the site [https://todo.polimorph.dev](https://todo.polimorph.dev).

- Click `Add Task` to create a new task. You can attach files if desired

- Click `Edit` on a task to edit it

- Click `Duplicate` on a task to create a copy of it

- Click `Delete` on a task to remove it

- Click the checkbox next to a task to mark it as completed. Completed tasks will move to the `Completed Tasks` section

- Use the search bar to filter tasks

## Easter Eggs
- There are a couple... (what is that background??? why is it a full-on physics simulation??? how much time did I waste making this????)

## Development
- The project is visible on [github](https://github.com/PolymorphicAgent/MasterProcrastinator).

- To open the project locally, clone the repository and open `index.html` in a web browser. 

- For development, it's recommended to use a local server (i.e. using the Live Server extension in VSCode, or python `python3 -m http.server 8080`) to avoid CORS issues with IndexedDB.

## TODO
- Add new color themes (Currently in development)
    - Support saving/loading/editing custom color themes

- Introduce a versioning system to show new updates (Currently in development)
    - Global application version
    - Once a day, check for new version (maybe from github?) (maybe have a setting for this?)
    - If new version available, prompt user to reload the page
    - Whenever the page upgrades to a new version, show a "What's New" dialog

- Add feedback capabilities and maybe the ability to send out polls to users
- Fix hitting export twice for the thing to export
- Style scrollbar on description box
- Add a "new task here" on hover between tasks
- Add the ability to distinguish between tasks and events
- Add the ability to select multiple tasks to move/delete/complete them
- Add periodic render calls (dates lag behind if left open overnight)
- Add the ability to save icons and colors globally so that they can be easily selected from when creating a task
- Add a numbers (x/x) or percentage for the progress bar
- Fix issue where long descriptions over-expand page horizontally
- Add page autoscroll on drag
- Add move to top & swap with buttons for each task (on hover)
- Save date created and have a setting to display date created on each task tile (the date will show when you hit 'edit')
- Fix that stupid selection arrow hover for the sorting dropdown
    - https://stackoverflow.com/questions/14218307/select-arrow-style-change



- Wayyyy in the future if possible
    - calendar view for events with due dates
    - integrated pomodoro timer

## Feature Requests
*Think of a new feature/bug fix that's not in the list above?*
- Open an issue with the appropriate tag (i.e. 'bug' if it's a bug, 'feature-request' if it's a feature request)!