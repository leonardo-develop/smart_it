
const menuIcon = document.querySelector('.menu-icon');
const navLinks = document.querySelector('.nav-links');

menuIcon.addEventListener('click', () => {
   
    if (navLinks.style.display === 'block') {
        navLinks.style.display = 'none';
    } else {
        navLinks.style.display = 'block';
        
        navLinks.style.position = 'absolute';
        navLinks.style.top = '70px';
        navLinks.style.left = '0';
        navLinks.style.width = '100%';
        navLinks.style.backgroundColor = '#fff';
    }
});

window.onscroll = function() {
    const header = document.querySelector('header');
    if (window.scrollY > 50) {
        header.style.backgroundColor = 'rgba(255, 255, 255, 0.95)'; 
        header.style.boxShadow = '0 2px 10px rgba(0,0,0,0.1)';
        header.style.position = 'fixed'; 
    } else {
        header.style.backgroundColor = 'transparent';
        header.style.boxShadow = 'none';
        header.style.position = 'absolute'; 
    }
};