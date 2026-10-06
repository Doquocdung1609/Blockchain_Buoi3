# DominionDAO - Checklist kiểm thử UI và demo Sepolia

## Chuẩn bị

- [ ] Node.js và npm đã cài đặt
- [ ] `npm run install:all` hoàn tất
- [ ] MetaMask installed/enabled
- [ ] Không dùng ví chứa tài sản thật
- [ ] Wallet A/B/C có Sepolia ETH cho value + gas
- [ ] Sepolia selected (Chain ID `11155111`)
- [ ] `blockchain/.env` chỉ tồn tại local, không commit
- [ ] Contract compile thành công
- [ ] `npm run test:contract` pass
- [ ] DominionDAO đã deploy lên Sepolia
- [ ] Đã lưu transaction/address deploy trên Etherscan

## Contract dùng chung

- [ ] Cả nhóm dùng đúng **một** contract address
- [ ] `frontend/.env` có `REACT_APP_CONTRACT_ADDRESS`
- [ ] `frontend/.env` có `REACT_APP_CHAIN_ID=11155111`
- [ ] ABI đã sync bằng `npm run compile` hoặc `npm run sync:abi`
- [ ] Frontend restart sau khi sửa `.env`

## Kết nối và network

- [ ] Frontend mở tại `http://localhost:3000`
- [ ] Wallet connected
- [ ] Connected address hiển thị đúng
- [ ] Sepolia badge hiển thị đúng
- [ ] Wrong network warning hoạt động
- [ ] Switch to Sepolia hoạt động
- [ ] Đổi account cập nhật wallet/contribution/role
- [ ] Đổi network cập nhật warning và permissions
- [ ] Contract loaded
- [ ] Current block hiển thị trong Debug panel

## Dashboard và contribution

- [ ] DAO balance loaded từ contract
- [ ] Personal contribution loaded từ contract
- [ ] Stakeholder status loaded từ contract
- [ ] Input từ chối amount `<= 0`
- [ ] Quick amount buttons hoạt động
- [ ] Contribute mở MetaMask
- [ ] Waiting/Pending/Confirmed hiển thị đúng
- [ ] Contribute transaction success trên Etherscan
- [ ] DAO balance tăng đúng
- [ ] Personal contribution tăng đúng
- [ ] Tổng contribution `>= 0.01 ETH` trở thành Stakeholder

## Proposal

- [ ] Non-stakeholder không thấy nút tạo proposal
- [ ] Stakeholder thấy nút New proposal
- [ ] Title bắt buộc
- [ ] Description bắt buộc
- [ ] Beneficiary address được validate
- [ ] Zero address bị chặn
- [ ] Amount phải lớn hơn 0
- [ ] Amount không vượt DAO balance
- [ ] Proposal creation mở MetaMask
- [ ] Proposal mới xuất hiện trong danh sách
- [ ] Proposal data khớp transaction/contract
- [ ] Proposal list filters hoạt động
- [ ] Trang `/proposal/:id` hoạt động

## Countdown và vote

- [ ] Countdown bắt đầu gần `05:00`
- [ ] Countdown update mỗi giây không reload trang
- [ ] Vote ACCEPT mở MetaMask và success
- [ ] Vote REJECT mở MetaMask và success (wallet khác)
- [ ] Upvote count cập nhật
- [ ] Downvote count cập nhật
- [ ] Vote chart cập nhật
- [ ] Voter list hiển thị wallet/choice/timestamp
- [ ] Duplicate vote bị chặn với message rõ ràng
- [ ] Vote sau expiry bị chặn

## Payout và beneficiary proof

- [ ] Payout locked trước expiry
- [ ] Proposal rejected/tie không thể payout
- [ ] Proposal thắng hiển thị `PASSED` sau expiry
- [ ] Stakeholder có thể bấm payout sau expiry
- [ ] Payout mở MetaMask
- [ ] Payout transaction success
- [ ] Proposal trở thành `PAID`
- [ ] DAO balance giảm đúng amount
- [ ] Double payout bị chặn
- [ ] Beneficiary address hiển thị đúng
- [ ] Beneficiary balance before hiển thị
- [ ] Beneficiary balance after hiển thị
- [ ] Received delta bằng proposal amount
- [ ] Etherscan transaction link mở được
- [ ] Wallet beneficiary thực sự nhận Sepolia ETH

## Demo cuối

- [ ] Wallet A contribute `0.01 ETH`
- [ ] Wallet B contribute `0.01 ETH`
- [ ] Wallet C contribute `0.01 ETH`
- [ ] A tạo proposal `0.005 ETH` cho C
- [ ] A/B/C vote ACCEPT
- [ ] Chờ đủ 5 phút
- [ ] Một Stakeholder payout
- [ ] UI hiển thị PAID + transaction hash
- [ ] Etherscan status success
- [ ] C nhận đúng `0.005 ETH`

