const express = require('express');
const router = express.Router();

router.use(express.json());

// 주문하기
router.post('/', (req,res) => {
    res.json('주문하기');
});

// 주문목록 조회
router.get('/', (req,res) => {
    res.json('주문 목록 조회');
});

// 주문 상세 상품 조회
router.get('/:id', (req,res) => {
    res.json('주문 상세 상품 조회');
});

// // 장바구니에서 선택한 주문 예상 상품 조회
// router.get('/books/:id', (req,res) => {
//     res.json('개별 도서 조회');
// });

module.exports = router