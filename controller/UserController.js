const conn = require('../mariadb'); // db 모듈
const {StatusCodes} = require('http-status-codes'); // status code 모듈
const jwt = require('jsonwebtoken'); // jwt 모듈
const crypto = require('crypto'); // crypto 모듈 : 암호화
const dotenv = require('dotenv'); // dotenv 모듈
dotenv.config();

// 회원가입
const join = (req,res) => {
    const {email, password} = req.body;

    let sql = 'INSERT INTO users (email, password, salt) VALUES (?, ?, ?)';

        //비밀번호 암호화
         // 회원가입 시 비밀번호를 암호화해서 암호화된 비밀번호, salt 값을 같이 DB 저장. 
        const salt = crypto.randomBytes(10).toString('base64');
        const hashPassword = crypto.pbkdf2Sync(password, salt, 10000, 10, 'sha512').toString('base64')
    
    let values = [email, hashPassword, salt];
    conn.query(sql, values,
        (err, results) => {
            if(err) {
                console.log(err);
                return res.status(StatusCodes.BAD_REQUEST).end(); // Bad Request
            }

            return res.status(StatusCodes.CREATED).json(results);
        })
    };
// 로그인
const login = (req,res) => {
    const {email, password} = req.body;

    let sql = 'SELECT * FROM users WHERE email = ?';
    conn.query(sql, email,
        (err, results) => {
            if(err) {
                console.log(err);
                return res.status(StatusCodes.BAD_REQUEST).end(); // Bad Request
                }

                const loginUser = results[0]; 

                //salt 값 꺼내서 비밀번호 암호화 해보고 
                const hashPassword = crypto.pbkdf2Sync(password, loginUser.salt, 10000, 10, 'sha512').toString('base64')
                // => 디비 비밀번호랑 비교.
                if(loginUser && loginUser.password == hashPassword) {
                    // 토큰 발행
                    const token = jwt.sign({
                        email : loginUser.email
                    }, process.env.PRIVATE_KEY, {
                        expiresIn : '10m',
                        issuer : "yooga"
                    });

                    // 토큰 쿠키에 담기.
                    res.cookie("token", token, {
                        httpOnly : true
                    });
                    console.log(token);

                    return res.status(StatusCodes.OK).json(results);
                } else {
                    return res.status(StatusCodes.UNAUTHORIZED).end(); // 401 : 비인증 상태, 403 : Forbidden (접근 근리 X)
                }
            }  
        )
    };
// 비밀번호 초기화 요청
const passwordResetRequest = (req,res) => {
        const {email} = req.body;

        let sql = 'SELECT * FROM users WHERE email = ?';
        conn.query(sql, email,
            (err, results) => {
                if(err) {
                    console.log(err);
                    return res.status(StatusCodes.BAD_REQUEST).end(); // Bad Request
                    }

                    // 이메일로 유저가 있는지 찾아보자.
                    const user = results[0];
                    if (user) {
                        return res.status(StatusCodes.OK).json({
                            email : email
                        });
                    } else {
                        return res.status(StatusCodes.UNAUTHORIZED).end();
                    }
            }
        )
    };
// 비밀번호 초기화
const passwordReset = (req,res) => {
        const {email, password} = req.body;

        let sql = 'UPDATE users SET password=?, salt=? WHERE email=?';

        // 회원가입 시 비밀번호를 암호화해서 암호화된 비밀번호, salt 값을 같이 DB 저장. 
        const salt = crypto.randomBytes(10).toString('base64');
        const hashPassword = crypto.pbkdf2Sync(password, salt, 10000, 10, 'sha512').toString('base64')

        let values = [hashPassword, salt, email];
        conn.query(sql, values,
            (err, results) => {
                if(err) {
                    console.log(err);
                    return res.status(StatusCodes.BAD_REQUEST).end(); // Bad Request
                }
                if(results.affectedRows == 0)
                    return res.status(StatusCodes.BAD_REQUEST).end();
                else
                    return res.status(StatusCodes.OK).json(results);
            })
    };

    module.exports = {
        join,
        login,
        passwordResetRequest,
        passwordReset
    };