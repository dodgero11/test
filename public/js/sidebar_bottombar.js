function handleResize() {
    const sidebar = document.querySelector('.sidebar');
    const bottomBar = document.querySelector('.bottom-bar');
    
    // Kiểm tra kích thước màn hình
    if (window.innerWidth < 768) {
        sidebar.style.display = 'none';
        bottomBar.style.display = 'flex';
    } else {
        sidebar.style.display = 'flex';
        bottomBar.style.display = 'none';
    }
}

// Gọi hàm khi tải trang và khi thay đổi kích thước
window.addEventListener('resize', handleResize);
window.addEventListener('DOMContentLoaded', handleResize);

let lastScrollPosition = 0; // Lưu trữ vị trí cuộn cuối cùng
const threshold = 30; // Ngưỡng cuộn để bắt đầu ẩn (có thể tùy chỉnh)
const halfScreenHeight = window.innerHeight / 2; // Một nửa chiều cao màn hình

function handleScroll() {
    const bottomBar = document.querySelector('.bottom-bar');

    // Lấy vị trí cuộn hiện tại
    const currentScrollPosition = window.scrollY || document.documentElement.scrollTop;

    // Điều kiện ẩn/hiện
    if (currentScrollPosition > lastScrollPosition + threshold) {
        // Nếu cuộn xuống và đã vượt quá ngưỡng, ẩn thanh
        bottomBar.classList.add('hidden');
    } else if (currentScrollPosition < lastScrollPosition - threshold || currentScrollPosition < halfScreenHeight) {
        // Nếu cuộn lên hoặc ở gần đầu trang, hiển thị lại
        bottomBar.classList.remove('hidden');
    }

    // Cập nhật vị trí cuộn cuối cùng
    lastScrollPosition = currentScrollPosition;
}

// Gắn sự kiện scroll
window.addEventListener('scroll', handleScroll);

document.addEventListener('DOMContentLoaded', function () {
    const menuButton = document.getElementById('menuButton');
    const dropdownMenu = document.getElementById('dropdownMenu');

    // Debugging: Check if elements are found
    console.log('Menu Button:', menuButton);
    console.log('Dropdown Menu:', dropdownMenu);

    if (menuButton && dropdownMenu) {
        menuButton.addEventListener('click', function (event) {
            event.stopPropagation(); // Prevent closing immediately after opening
            dropdownMenu.classList.toggle('active');
            console.log('Dropdown toggled:', dropdownMenu.classList.contains('active')); // Debug
        });

        document.addEventListener('click', function () {
            dropdownMenu.classList.remove('active');
        });
    } else {
        console.error('Elements not found: Check your HTML structure.');
    }
});

// Toggle dark and light mode
const darkModeToggle = document.getElementById('darkModeToggle');
const lightModeToggle = document.getElementById('lightModeToggle');

// Add event listeners to the buttons
darkModeToggle.addEventListener('click', () => {
    document.body.classList.remove('light-mode');
    document.body.classList.add('dark-mode');
});

lightModeToggle.addEventListener('click', () => {
    document.body.classList.remove('dark-mode');
    document.body.classList.add('light-mode');
});