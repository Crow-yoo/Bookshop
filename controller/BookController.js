const conn = require('../mariadb'); // db 모듈
const {StatusCodes} = require('http-status-codes'); // status code 모듈


// (카테고리 별, 신간여부) 전체 도서 목록 조회
const allBooks = (req,res) => {
    let { category_id, news, limit, currentPage } = req.query;

    // limit : page당 도서 수       ex. 3
    // currentPage : 현재 몇 페이지  ex. 1, 2, 3 ...
    // offset :                   ex. limit * (currentPage-1) 

    let offset = limit * (currentPage-1);

    let sql = "SELECT *, (SELECT count(*) FROM likes WHERE liked_book_id=books.id) AS likes FROM books";
    let values = [];
    // 2개가 걸리는 것이 제일 위로 
    if(category_id&&news) {
        sql += " WHERE category_id=? AND pub_date BETWEEN DATE_SUB(NOW(), INTERVAL 1 MONTH) AND NOW()";
        values = [category_id];
    } else if(category_id) {
        sql += " WHERE category_id=?";
        values = [category_id];
    } else if(news) {
        sql += " WHERE pub_date BETWEEN DATE_SUB(NOW(), INTERVAL 1 MONTH) AND NOW()";
    }

    sql += " LIMIT ? OFFSET ?";
    values.push(parseInt(limit), offset);

        // 카테고리 별 조회
        conn.query(sql, values,
            (err, results) => {
            if(err) {
                console.log(err);
                return res.status(StatusCodes.BAD_REQUEST).end(); // Bad Request
            }

            if(results.length)
                return res.status(StatusCodes.OK).json(results);
            else
                return res.status(StatusCodes.NOT_FOUND).end();
    })
};

const bookDetail = (req,res) => {
    let {user_id} = req.body;
    let book_id = req.params.id;

    // SELECT * FROM books LEFT JOIN category ON books.category_id = category.id WHERE books.id=1;
    let sql = `SELECT *,
                    (SELECT count(*) FROM likes WHERE liked_book_id=books.id) AS likes,
                    (SELECT EXISTS (SELECT * FROM likes WHERE user_id=? AND liked_book_id=?)) AS liked
                FROM books 
                LEFT JOIN category
                ON books.category_id = category.category_id
                WHERE books.id=?`;
    let values = [user_id, book_id, book_id]
    conn.query(sql, values,
        (err, results) => {
        if(err) {
            console.log(err);
            return res.status(StatusCodes.BAD_REQUEST).end(); // Bad Request
        }

        if(results[0])
            return res.status(StatusCodes.OK).json(results[0]);
        else
            return res.status(StatusCodes.NOT_FOUND).end();
    })
};

module.exports = {
    allBooks,
    bookDetail,
};