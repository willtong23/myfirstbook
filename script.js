// 注意：先加 jsMind library 到 index.html <head>: <script src="https://cdn.jsdelivr.net/npm/jsmind@0.6.0/js/jsmind.js"></script>
 // 仲加 <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/jsmind@0.6.0/style/jsmind.css">

 document.addEventListener('DOMContentLoaded', () => {
     fetch('data.json')
         .then(response => response.json())
         .then(data => {
             window.bookData = data; // 儲 data for toggles
             renderBook(data, 'outline'); // Default view
         })
         .catch(error => console.error('Error loading data:', error));

     document.getElementById('format-select').addEventListener('change', (e) => {
         const format = e.target.value;
         renderBook(window.bookData, format);
     });
 });

 function renderBook(data, format) {
     const content = document.getElementById('book-content');
     content.innerHTML = ''; // Clear

     if (format === 'outline') {
         // Outline View (expandable)
         data.chapters.forEach(chapter => {
             const div = document.createElement('div');
             div.classList.add('chapter');

             // Create elements separately to avoid querySelector issues
             const titleElement = document.createElement('h2');
             titleElement.className = 'expandable';
             titleElement.textContent = chapter.title;

             const contentElement = document.createElement('div');
             contentElement.className = 'hidden';
             contentElement.innerHTML = chapter.content;

             // Add click handler with null check
             titleElement.addEventListener('click', () => {
                 if (contentElement && contentElement.classList) {
                     contentElement.classList.toggle('hidden');
                     console.log('Toggle successful for:', chapter.title);
                 } else {
                     console.error('Content element not found or classList missing for:', chapter.title);
                 }
             });

             div.appendChild(titleElement);
             div.appendChild(contentElement);
             content.appendChild(div);
         });
     } else if (format === 'text') {
         // Full Text View (linear)
         data.chapters.forEach(chapter => {
             const div = document.createElement('div');
             div.innerHTML = `<h2>${chapter.title}</h2><p>${chapter.content}</p>`;
             content.appendChild(div);
         });
     } else if (format === 'mindmap') {
         // Mind Map View (using jsMind) - Show actual book structure
         content.innerHTML = '<div id="jsmind_container" style="width: 100%; height: 600px;"></div>';

         // Use actual book data - Remove slice(0,8) to show all chapters
         const mind = {
             meta: { name: data.title, author: 'Interactive Book', version: '1.0' },
             format: 'node_tree',
             data: {
                 id: 'root',
                 topic: data.title,
                 children: data.chapters.map((chapter, index) => ({
                     id: 'chapter_' + index,
                     topic: chapter.title.length > 30 ? chapter.title.substring(0, 30) + '...' : chapter.title,
                     direction: index % 2 === 0 ? 'right' : 'left',
                     expanded: true, // Default expanded
                     "background-color": getChapterColor(chapter.title), // New: Color by pillar
                     "data-summary": chapter.content.substring(0, 100) + '...' // Hover tooltip content
                 }))
             }
         };

         const options = {
             container: 'jsmind_container',
             theme: 'primary',
             editable: false,
             view: { hmargin: 120, vmargin: 80 }
         };

         const jm = new jsMind(options);
         jm.show(mind);

         // Alternative approach: Use DOM click events directly
         jm.disable_edit(); // Disable edit for now
         
         console.log('Setting up DOM click listener on mind map...');
         
         // Wait a bit for jsMind to fully render, then add DOM event listener
         setTimeout(() => {
             const container = document.getElementById('jsmind_container');
             if (container) {
                 container.addEventListener('click', (event) => {
                     console.log('DOM click detected on mind map');
                     console.log('Clicked element:', event.target);
                     
                     // Look for jsmind node element
                     let nodeElement = event.target;
                     while (nodeElement && !nodeElement.getAttribute('nodeid')) {
                         nodeElement = nodeElement.parentElement;
                     }
                     
                     if (nodeElement) {
                         const nodeId = nodeElement.getAttribute('nodeid');
                         console.log('Found node ID:', nodeId);
                         
                         if (nodeId && nodeId !== 'root') {
                             const match = nodeId.match(/chapter_(\d+)/);
                             const chapterIndex = match ? parseInt(match[1]) : null;
                             console.log('Chapter index:', chapterIndex);
                             
                             if (chapterIndex !== null && data.chapters[chapterIndex]) {
                                 const chapter = data.chapters[chapterIndex];
                                 console.log('Showing modal for:', chapter.title);
                                 showModal(chapter.content);
                             } else {
                                 console.log('Chapter not found');
                                 showModal('Chapter content not found');
                             }
                         }
                     } else {
                         console.log('No node element found');
                     }
                 });
                 console.log('DOM click listener added successfully');
             } else {
                 console.error('Mind map container not found');
             }
         }, 1000);
     }
 }

 // New function: Get chapter color based on content type
 function getChapterColor(title) {
     if (title.includes('創造') || title.includes('創新')) return '#FF9999'; // Red for Creativity
     if (title.includes('批判') || title.includes('思維')) return '#99FF99'; // Green for Critical Thinking  
     if (title.includes('同理') || title.includes('情感')) return '#9999FF'; // Blue for Empathy
     if (title.includes('支柱')) return '#FFCC99'; // Orange for Pillars
     if (title.includes('實踐') || title.includes('策略')) return '#99FFFF'; // Cyan for Practice
     if (title.includes('引言') || title.includes('前言')) return '#FFFF99'; // Yellow for Introduction
     return '#E6E6E6'; // Default light gray
 }

 // New function: Show content in modal (add to index.html: <div id="modal" style="display:none; position:fixed; top:20%; left:20%; width:60%; height:60%; background:white; border:1px solid black; padding:20px; overflow:auto;"><button onclick="document.getElementById('modal').style.display='none'">Close</button><div id="modal-content"></div></div>)
 function showModal(text) {
     const modal = document.getElementById('modal');
     const modalContent = document.getElementById('modal-content');
     if (modal && modalContent) {
         modalContent.innerHTML = text;
         modal.style.display = 'block';
     } else {
         console.error('Modal elements not found');
         alert(text); // Fallback
     }
 }

 // Add Expand All function (add button in index.html: <button id="expand-all">Expand All</button>)
 const expandAllBtn = document.getElementById('expand-all');
 if (expandAllBtn) {
     expandAllBtn.addEventListener('click', () => {
         document.querySelectorAll('.hidden').forEach(el => {
             if (el && el.classList) el.classList.remove('hidden');
         });
     });
 }

 // Add search input in index.html: <input id="search" type="text" placeholder="Search chapters">
 const searchInput = document.getElementById('search');
 if (searchInput) {
     searchInput.addEventListener('input', (e) => {
         const term = e.target.value.toLowerCase();
         document.querySelectorAll('.chapter').forEach(ch => {
             ch.style.display = ch.textContent.toLowerCase().includes(term) ? 'block' : 'none';
         });
     });
 }

 // User Notes with localStorage
 const notes = document.getElementById('notes');
 const saveBtn = document.getElementById('save-notes');
 if (notes && saveBtn) {
     // Load saved notes on page load
     notes.value = localStorage.getItem('bookNotes') || '';
     
     // Save notes when button clicked
     saveBtn.addEventListener('click', () => {
         localStorage.setItem('bookNotes', notes.value);
         alert('Notes saved!');
     });
     
     // Auto-save notes every 30 seconds
     setInterval(() => {
         if (notes.value !== localStorage.getItem('bookNotes')) {
             localStorage.setItem('bookNotes', notes.value);
             console.log('Notes auto-saved');
         }
     }, 30000);
 }