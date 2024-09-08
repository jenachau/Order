const express = require('express');
const bodyParser = require('body-parser');
const puppeteer = require('puppeteer');

const app = express();
app.use(bodyParser.json());
app.use(express.static('public')); // Thư mục chứa HTML và CSS

// Hàm kiểm tra URL
function isValidUrl(url) {
    const regex = /^(http:\/\/|https:\/\/)[^\s/$.?#].[^\s]*$/i;
    return regex.test(url);
}

app.post('/fetchData', async (req, res) => {
    const { url } = req.body;
    if (!url || !isValidUrl(url)) {
        return res.status(400).json({ error: 'URL không hợp lệ hoặc không phải là HTTP/HTTPS' });
    }

    try {
        const browser = await puppeteer.launch({ headless: true });
        const page = await browser.newPage();
        await page.goto(url, { waitUntil: 'networkidle2' });

        async function collectFoodData(page) {
            return page.evaluate(async () => {
                const items = [];
                let previousHeight = document.body.scrollHeight;
        
                while (true) {
                    const itemElements = document.querySelectorAll('.item-restaurant-row');
                    itemElements.forEach(item => {
                        const name = item.querySelector('.item-restaurant-name')?.innerText.trim();
                        const image = item.querySelector('.item-restaurant-img img')?.src;
                        const price = item.querySelector('.current-price')?.innerText.trim();
                        const status = item.querySelector('.btn-over')?.innerText.trim();
                        const description = item.querySelector('.item-restaurant-desc')?.innerText.trim(); // Thêm dòng này để lấy mô tả
        
                        if (name && image && !items.some(i => i.name === name)) {
                            items.push({ name, image, price, status, description }); // Thêm mô tả vào đối tượng
                        }
                    });
        
                    window.scrollBy(0, window.innerHeight);
                    await new Promise(resolve => setTimeout(resolve, 100));
        
                    const currentHeight = document.body.scrollHeight;
                    if (currentHeight === previousHeight) break;
                    previousHeight = currentHeight;
                }
        
                return items;
            });
        }        

        const foodData = await collectFoodData(page);
        console.log(`Số lượng món ăn thu thập được: ${foodData.length}`);
        foodData.forEach(item => {
            console.log(`Tên món ăn: ${item.name}`);
            console.log(`Hình ảnh: ${item.image}`);
            console.log(`Giá: ${item.price}`);
            console.log(`Mô tả: ${item.description}`);
        });
        await browser.close();

        res.json(foodData);
    } catch (error) {
        console.error('Có lỗi xảy ra:', error);
        res.status(500).json({ error: 'Có lỗi xảy ra khi lấy dữ liệu' });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
