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
            div.innerHTML = `<h2 class="expandable">${chapter.title}</h2><div class="hidden">${chapter.content}</div>`;
            div.querySelector('.expandable').addEventListener('click', () => {
                div.querySelector('.hidden').classList.toggle('hidden');
            });
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
        
        // Use actual book data
        const mind = {
            meta: { name: data.title, author: 'Interactive Book', version: '1.0' },
            format: 'node_tree',
            data: { 
                id: 'root', 
                topic: data.title,
                children: data.chapters.slice(0, 8).map((chapter, index) => ({
                    id: 'chapter_' + index,
                    topic: chapter.title.length > 30 ? chapter.title.substring(0, 30) + '...' : chapter.title,
                    direction: index % 2 === 0 ? 'right' : 'left'
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
    }
}

// Add Expand All function (add button in index.html: <button id="expand-all">Expand All</button>)
document.getElementById('expand-all').addEventListener('click', () => {
    document.querySelectorAll('.hidden').forEach(el => el.classList.remove('hidden'));
});

// Add search input in index.html: <input id="search" type="text" placeholder="Search chapters">
document.getElementById('search').addEventListener('input', (e) => {
    const term = e.target.value.toLowerCase();
    document.querySelectorAll('.chapter').forEach(ch => {
        ch.style.display = ch.textContent.toLowerCase().includes(term) ? 'block' : 'none';
    });
});