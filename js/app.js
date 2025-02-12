const API_KEY = 'a5b213a231ca671a9dd83f1bacd9d982';
const BASE_URL = 'https://api.themoviedb.org/3';
const IMAGE_BASE_URL = 'https://image.tmdb.org/t/p';

// Cache de elementos DOM
const elements = {
    trendingCarousel: document.getElementById('trendingCarousel'),
    popularMovies: document.getElementById('popularMovies'),
    genresList: document.getElementById('genresList'),
    movieModal: document.getElementById('movieModal'),
    searchInput: document.querySelector('.search-bar input'),
    themeToggle: document.querySelector('.theme-toggle')
};

// Estado de la aplicación
const state = {
    currentTheme: 'light',
    movies: [],
    genres: []
};

// Funciones de utilidad
const fetchData = async (endpoint) => {
    try {
        const separator = endpoint.includes('?') ? '&' : '?';
        const url = `${BASE_URL}${endpoint}${separator}api_key=${API_KEY}&language=es-ES`;
        
        const response = await fetch(url);
        if (!response.ok) throw new Error('Error en la petición');
        return await response.json();
    } catch (error) {
        console.error('Error:', error);
        return null;
    }
};

const getImageUrl = (path, size = 'w500') => {
    return path ? `${IMAGE_BASE_URL}/${size}${path}` : 'placeholder-image.jpg';
};

// Funciones principales
const loadTrending = async () => {
    const data = await fetchData('/trending/movie/week');
    if (!data) return;

    elements.trendingCarousel.innerHTML = data.results
        .slice(0, 10)
        .map(movie => `
            <div class="carousel-item" data-movie-id="${movie.id}">
                <img src="${getImageUrl(movie.poster_path)}" 
                     alt="${movie.title}"
                     loading="lazy">
                <div class="carousel-item__info">
                    <h3>${movie.title}</h3>
                    <span class="rating">
                        <i class="fas fa-star"></i>
                        ${movie.vote_average.toFixed(1)}
                    </span>
                </div>
            </div>
        `).join('');
};

const loadPopularMovies = async () => {
    const data = await fetchData('/movie/popular');
    if (!data) return;

    elements.popularMovies.innerHTML = data.results
        .map(movie => `
            <div class="movie-card" data-movie-id="${movie.id}">
                <img src="${getImageUrl(movie.poster_path)}" 
                     alt="${movie.title}"
                     loading="lazy">
                <div class="movie-card__info">
                    <h3>${movie.title}</h3>
                    <p>${movie.overview.slice(0, 100)}...</p>
                </div>
            </div>
        `).join('');
};

const loadGenres = async () => {
    const data = await fetchData('/genre/movie/list');
    if (!data) return;

    state.genres = data.genres;
    elements.genresList.innerHTML = data.genres
        .map(genre => `
            <button class="genre-button" data-genre-id="${genre.id}">
                ${genre.name}
            </button>
        `).join('');
};

const showMovieDetails = async (movieId) => {
    const data = await fetchData(`/movie/${movieId}`);
    if (!data) return;

    elements.movieModal.innerHTML = `
        <div class="modal__content">
            <button class="modal__close" aria-label="Cerrar modal">
                <i class="fas fa-times"></i>
            </button>
            <img src="${getImageUrl(data.backdrop_path, 'original')}" 
                 alt="${data.title}">
            <h2>${data.title}</h2>
            <p>${data.overview}</p>
            <div class="modal__info">
                <span>Valoración: ${data.vote_average}</span>
                <span>Año: ${data.release_date.split('-')[0]}</span>
                <span>Duración: ${data.runtime} min</span>
            </div>
        </div>
    `;
    elements.movieModal.setAttribute('aria-hidden', 'false');
    
    const closeButton = elements.movieModal.querySelector('.modal__close');
    closeButton.addEventListener('click', closeModal);
    document.addEventListener('keydown', handleEscapeKey);
    elements.movieModal.addEventListener('click', handleOutsideClick);
};

const closeModal = () => {
    elements.movieModal.setAttribute('aria-hidden', 'true');
    document.removeEventListener('keydown', handleEscapeKey);
    elements.movieModal.removeEventListener('click', handleOutsideClick);
};

const handleEscapeKey = (e) => {
    if (e.key === 'Escape') {
        closeModal();
    }
};

const handleOutsideClick = (e) => {
    if (e.target === elements.movieModal) {
        closeModal();
    }
};

const searchMovies = async (query) => {
    try {
        console.log('Buscando:', query);
        const data = await fetchData(`/search/movie?query=${encodeURIComponent(query)}`);
        console.log('Resultados:', data);
        
        if (!data || !data.results) return;

        let searchResults = document.querySelector('.search-results');
        if (!searchResults) {
            searchResults = document.createElement('div');
            searchResults.className = 'search-results';
            elements.searchInput.parentElement.appendChild(searchResults);
        }

        if (data.results.length === 0) {
            searchResults.innerHTML = `
                <div class="search-results__message">
                    No se encontraron resultados para "${query}"
                </div>
            `;
            searchResults.style.display = 'block';
            return;
        }

        searchResults.innerHTML = `
            <div class="search-results__content">
                ${data.results.slice(0, 5).map(movie => `
                    <div class="search-result-item" data-movie-id="${movie.id}">
                        <img src="${getImageUrl(movie.poster_path, 'w92')}" 
                             alt="${movie.title}"
                             onerror="this.src='placeholder.jpg'">
                        <div class="search-result-item__info">
                            <h4>${movie.title}</h4>
                            <span>${movie.release_date ? movie.release_date.split('-')[0] : 'N/A'}</span>
                        </div>
                    </div>
                `).join('')}
            </div>
        `;
        searchResults.style.display = 'block';

        const resultItems = searchResults.querySelectorAll('.search-result-item');
        resultItems.forEach(item => {
            item.addEventListener('click', () => {
                showMovieDetails(item.dataset.movieId);
                searchResults.style.display = 'none';
                elements.searchInput.value = '';
            });
        });
    } catch (error) {
        console.error('Error en la búsqueda:', error);
    }
};

const setupEventListeners = () => {
    elements.themeToggle.addEventListener('click', () => {
        document.body.classList.toggle('dark-theme');
        state.currentTheme = state.currentTheme === 'light' ? 'dark' : 'light';
        localStorage.setItem('theme', state.currentTheme);
    });

    elements.searchInput.addEventListener('input', debounce(async (e) => {
        const query = e.target.value.trim();
        const searchResults = document.querySelector('.search-results');
        
        if (query.length < 2) {
            if (searchResults) searchResults.style.display = 'none';
            return;
        }
        
        await searchMovies(query);
    }, 500));

    document.addEventListener('click', (e) => {
        const searchResults = document.querySelector('.search-results');
        const searchContainer = elements.searchInput.parentElement;
        
        if (!searchContainer.contains(e.target) && searchResults) {
            searchResults.style.display = 'none';
        }
    });

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            const searchResults = document.querySelector('.search-results');
            if (searchResults) searchResults.style.display = 'none';
            elements.searchInput.value = '';
        }
    });

    document.addEventListener('click', (e) => {
        const movieCard = e.target.closest('[data-movie-id]');
        if (movieCard) {
            showMovieDetails(movieCard.dataset.movieId);
        }
    });
};

const debounce = (func, wait) => {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
};

const init = async () => {
    const savedTheme = localStorage.getItem('theme') || 'light';
    if (savedTheme === 'dark') {
        document.body.classList.add('dark-theme');
    }
    state.currentTheme = savedTheme;

    await Promise.all([
        loadTrending(),
        loadPopularMovies(),
        loadGenres()
    ]);

    setupEventListeners();
};

document.addEventListener('DOMContentLoaded', init);