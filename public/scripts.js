var mxn = 'Thuchau0407'
// Lưu dữ liệu vào localStorage
function saveNamesToLocalStorage(names) {
    localStorage.setItem('namesList', JSON.stringify(names));
}

function saveMenuToLocalStorage(menuItems) {
    localStorage.setItem('menuItems', JSON.stringify(menuItems));
}

function saveSelectionsToLocalStorage(selections) {
    localStorage.setItem('selections', JSON.stringify(selections));
}

function saveUrlToLocalStorage(url) {
    localStorage.setItem('currentUrl', url);
}

// Lấy dữ liệu từ localStorage
function getNamesFromLocalStorage() {
    const names = localStorage.getItem('namesList');
    return names ? JSON.parse(names) : [];
}

function getMenuFromLocalStorage() {
    const menu = localStorage.getItem('menuItems');
    return menu ? JSON.parse(menu) : [];
}

function getSelectionsFromLocalStorage() {
    const selections = localStorage.getItem('selections');
    return selections ? JSON.parse(selections) : {};
}

function getUrlFromLocalStorage() {
    return localStorage.getItem('currentUrl') || '';
}

// Hiển thị/ẩn khu vực thêm tên
document.getElementById('add-button').addEventListener('click', () => {
    const addForm = document.getElementById('add-form');
    addForm.style.display = addForm.style.display === 'none' ? 'block' : 'none';
});

// Thêm tên mới vào danh sách
document.getElementById('submit-name-button').addEventListener('click', () => {
    const newNameInput = document.getElementById('new-name-input');
    const newName = newNameInput.value.trim();

    if (newName) {
        const nameList = document.getElementById('names-list');
        const listItem = document.createElement('div');
        listItem.classList.add('name-item');

        const nameText = document.createElement('span');
        nameText.textContent = newName;

        const dishDropdown = document.createElement('select');
        dishDropdown.classList.add('dishes-dropdown');
        dishDropdown.innerHTML = '<option value=""></option>'; // Mục lựa chọn đầu tiên

        // Cập nhật dropdown với các món từ menu được lưu trữ
        const menuItems = getMenuFromLocalStorage();
        menuItems.forEach(item => {
            if (item.status !== 'Hết hàng') {
                const option = document.createElement('option');
                option.value = item.name;
                option.textContent = item.name;
                dishDropdown.appendChild(option);
            }
        });

        listItem.appendChild(nameText);
        listItem.appendChild(dishDropdown);
        nameList.appendChild(listItem);

        // Lưu tên vào localStorage
        const names = getNamesFromLocalStorage();
        names.push(newName);
        saveNamesToLocalStorage(names);

        // Reset ô input và ẩn khu vực thêm tên
        newNameInput.value = '';
        document.getElementById('add-form').style.display = 'none';

        // Lưu lựa chọn của người dùng khi chọn món từ dropdown
        dishDropdown.addEventListener('change', () => {
            const selections = getSelectionsFromLocalStorage();
            selections[newName] = dishDropdown.value;
            saveSelectionsToLocalStorage(selections);
        });
    } else {
        alert('Vui lòng nhập tên');
    }
});

// Xử lý việc tải file
// Xử lý sự kiện khi chọn file
document.getElementById('file-input').addEventListener('change', (event) => {
    const filePasswordContainer = document.getElementById('file-password-container');
    filePasswordContainer.style.display = 'block'; // Hiển thị phần nhập mật khẩu và submit khi chọn file
});

// Xử lý xác thực mật khẩu khi người dùng nhấn "Submit"
document.getElementById('file-input').addEventListener('change', () => {
    const fileVerificationCode = prompt("Vui lòng nhập mã xác nhận:");

    if (fileVerificationCode !== mxn) {
        alert('Mã xác nhận không đúng');
        return;
    }

    // Nếu mã xác nhận đúng, xử lý file như bình thường
    const fileInput = document.getElementById('file-input');
    const file = fileInput.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
        const text = e.target.result;
        const names = text.split('\n').map(line => line.trim()).filter(line => line);
        const nameList = document.getElementById('names-list');
        nameList.innerHTML = ''; // Xóa nội dung cũ

        names.forEach(name => {
            const listItem = document.createElement('div');
            listItem.classList.add('name-item');

            const nameText = document.createElement('span');
            nameText.textContent = name;

            const dishDropdown = document.createElement('select');
            dishDropdown.classList.add('dishes-dropdown');
            dishDropdown.innerHTML = '<option value=""></option>'; // Mục lựa chọn đầu tiên

            listItem.appendChild(nameText);
            listItem.appendChild(dishDropdown);
            nameList.appendChild(listItem);

            // Lưu lựa chọn của người dùng khi chọn món từ dropdown
            dishDropdown.addEventListener('change', () => {
                const selections = getSelectionsFromLocalStorage();
                selections[name] = dishDropdown.value;
                saveSelectionsToLocalStorage(selections);
            });
        });

        saveNamesToLocalStorage(names); // Lưu tên vào localStorage
        location.reload(); // Reload lại trang sau khi xử lý file
    };
    reader.readAsText(file);
});


// Xử lý việc lấy dữ liệu menu
document.getElementById('fetch-button').addEventListener('click', async () => {
    const urlInput = document.getElementById('url-input');
    const url = urlInput.value;

    if (!url) {
        alert('Vui lòng nhập URL');
        return;
    }

    const verificationCode = prompt("Vui lòng nhập mã xác nhận:");

    if (verificationCode !== mxn) {
        alert('Mã xác nhận không đúng');
        return;
    }

    saveUrlToLocalStorage(url); // Lưu URL vào localStorage
    document.getElementById('url-label').textContent = `URL hiện tại: ${url}`; // Cập nhật URL hiện tại

    // Xóa dữ liệu cũ trong localStorage
    localStorage.removeItem('menuItems');
    localStorage.removeItem('selections');
    document.getElementById('selections-table').getElementsByTagName('tbody')[0].innerHTML = '';

    try {
        const response = await fetch('/fetchData', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ url })
        });

        if (!response.ok) {
            const errorData = await response.json();
            alert(errorData.error || 'Có lỗi xảy ra khi lấy dữ liệu');
            return;
        }

        const menuItems = await response.json();
        const menuContainer = document.getElementById('menu');
        const dishesDropdowns = document.querySelectorAll('.dishes-dropdown');
        menuContainer.innerHTML = '';

        // Xóa các tùy chọn hiện có trong tất cả các dropdown
        dishesDropdowns.forEach(dropdown => {
            dropdown.innerHTML = '<option value=""></option>'; // Xóa tùy chọn hiện tại
        });

        // Hiển thị menu và cập nhật dropdown
        menuItems.forEach(item => {
            if (item.status !== 'Hết hàng') {
                const menuItemHTML =
                    `<div class="menu-item">
                        <div class="menu-img">
                            <img src="${item.image}" alt="${item.name}">
                        </div>
                        <div class="menu-description">
                            <h4>${item.name}</h4>
                            <p>${item.description || 'Không có mô tả'}</p>
                        </div>
                        <div class="menu-price">
                            ${item.price}
                        </div>
                    </div>`;
                menuContainer.innerHTML += menuItemHTML;

                // Cập nhật dropdown với tên món
                dishesDropdowns.forEach(dropdown => {
                    const option = document.createElement('option');
                    option.value = item.name;
                    option.textContent = item.name;
                    dropdown.appendChild(option);
                });
            }
        });

        saveMenuToLocalStorage(menuItems); // Lưu menu vào localStorage
    } catch (error) {
        console.error('Có lỗi khi tải menu:', error);
    }
});



// Hàm cập nhật số lượng món đã chọn
function updateSelectionsSummary() {
    const selections = getSelectionsFromLocalStorage();
    const summaryContainer = document.getElementById('selections-table').getElementsByTagName('tbody')[0];
    summaryContainer.innerHTML = ''; // Xóa nội dung cũ

    const dishCounts = {}; // Đếm số lượng mỗi món

    // Đếm số lượng mỗi món
    for (const selectedDish of Object.values(selections)) {
        if (selectedDish) { // Chỉ đếm món nếu giá trị không rỗng
            dishCounts[selectedDish] = (dishCounts[selectedDish] || 0) + 1;
        }
    }

    // Hiển thị số lượng món đã chọn
    for (const [dish, count] of Object.entries(dishCounts)) {
        const row = document.createElement('tr');

        const dishCell = document.createElement('td');
        dishCell.textContent = dish;
        row.appendChild(dishCell);

        const countCell = document.createElement('td');
        countCell.textContent = count;
        row.appendChild(countCell);

        summaryContainer.appendChild(row);
    }
}



// Thêm sự kiện lắng nghe thay đổi dropdown
document.getElementById('names-list').addEventListener('change', () => {
    updateSelectionsSummary();
});

// Khôi phục dữ liệu khi tải trang
window.addEventListener('load', () => {
    // Khôi phục dữ liệu danh sách tên
    const names = getNamesFromLocalStorage();
    const selections = getSelectionsFromLocalStorage();
    const nameList = document.getElementById('names-list');
    nameList.innerHTML = ''; // Xóa nội dung cũ

    names.forEach(name => {
        const listItem = document.createElement('div');
        listItem.classList.add('name-item');

        const nameText = document.createElement('span');
        nameText.textContent = name;

        const dishDropdown = document.createElement('select');
        dishDropdown.classList.add('dishes-dropdown');
        dishDropdown.innerHTML = '<option value=""></option>'; // Mục lựa chọn đầu tiên

        // Nếu có món đã chọn trước đó, khôi phục lại
        if (selections[name]) {
            const option = document.createElement('option');
            option.value = selections[name];
            option.textContent = selections[name];
            option.selected = true;
            dishDropdown.appendChild(option);
        }

        listItem.appendChild(nameText);
        listItem.appendChild(dishDropdown);
        nameList.appendChild(listItem);

        // Lưu lựa chọn của người dùng khi chọn món từ dropdown
        dishDropdown.addEventListener('change', () => {
            const selections = getSelectionsFromLocalStorage();
            selections[name] = dishDropdown.value;
            saveSelectionsToLocalStorage(selections);
            updateSelectionsSummary(); // Cập nhật số lượng món đã chọn
        });
    });

    // Khôi phục menu
    const menuItems = getMenuFromLocalStorage();
    const menuContainer = document.getElementById('menu');
    const dishesDropdowns = document.querySelectorAll('.dishes-dropdown');
    menuContainer.innerHTML = '';

    menuItems.forEach(item => {
        if (item.status !== 'Hết hàng') {
            const menuItemHTML =
                `<div class="menu-item">
                    <div class="menu-img">
                        <img src="${item.image}" alt="${item.name}">
                    </div>
                    <div class="menu-description">
                        <h4>${item.name}</h4>
                        <p></p>
                    </div>
                    <div class="menu-price">
                        ${item.price}
                    </div>
                </div>`;
            menuContainer.innerHTML += menuItemHTML;

            // Cập nhật các dropdown với tên món
            dishesDropdowns.forEach(dropdown => {
                const option = document.createElement('option');
                option.value = item.name;
                option.textContent = item.name;
                dropdown.appendChild(option);
            });
        }
    });

    // Khôi phục URL
    const savedUrl = getUrlFromLocalStorage();
    if (savedUrl) {
        document.getElementById('url-input').value = savedUrl;
        document.getElementById('url-label').textContent = `URL hiện tại: ${savedUrl}`;
    }

    // Cập nhật số lượng món đã chọn khi tải trang
    updateSelectionsSummary();
});