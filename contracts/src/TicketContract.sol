// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import {ERC721} from "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";

contract TicketContract is ERC721, Ownable{

    // Custom Error -> untuk menunjukkan pesan error jika kondis error terpenuhi
    error EventAlreadyExists(uint256 eventId); // error jika event yang sama sudah pernah dibuat
    error EventNotFound(uint256 eventId); // error jika event tidak ditemukan
    error CategoryAlreadyExist(uint256 eventId, uint256 categoryId); // error jika kateogrinya sudah ada duluan
    error EventAlreadyPassed(); // waktu pelaksanaann event udah lewat
    error EmptyIssuerWalletAddress(); // error jika alamat penyelenggara kosong
    error ForbiddenZero(); // nilai 0 yang tidak diijinkan untuk semua variabel
    error NotAuthorized(); // error jika yang memanggil fungsi bukan owner atau organizer

    error CategoryNotFound(uint256 eventId, uint256 categoryId);
    error SalesClosed();
    error QuotaExceeded();
    error MaxPerWalletExceeded();
    error TicketNotFound(uint256 tokenId);
    error TicketAlreadyUsed(uint256 tokenId);
    

    // Struct 
    // struct itu seperti class untuk mendefinisikan sebuah object, ebdanya dengan class adalah tidak bisa memiliki fungsi / perilaku di dalamnya dan hanya pasif sebagai wadah
    struct EventInfo{
        bool exists;
        address organizer;
        uint64 eventTimestamp;
        uint32 maxPerWallet;
        bool salesOpen;
    }

    struct TicketCategory{
        bool exists;
        uint96 price;
        uint32 quota;
        uint32 minted; // atau sold alias jumlah terjual
    }

    struct TicketInfo {
        uint256 eventId;
        uint256 categoryId;
        uint96 originalPrice; // dikunci permanen saat minting, jadi calo tidak bisa markup harga nantinya
        bool used; // status check i di lokasi acara
    }

    address public marketplaceAddress; // alamat kontrak marketplace resmi
    address public systemSigner; // address signer backend yang merilis signature
    uint256 private _nextTokenId; // penghitung ID token NFT
    mapping(uint256 => TicketInfo) private _tickets; // mapping untuk menyimpan data ticket berdasarkan tokenid
    mapping(address => bytes32) private userIdentities; // data hash KYC KTP (wallet siap, milik identity hash yang mana)
    mapping(uint256 => bool) private usedNonces; // mekanisme anti replay attack signature, jadi nandain kalau nonce ini sudah eprnah dipakai   
    mapping(uint256 => EventInfo) private events;
    mapping(uint256 => mapping(uint256 => TicketCategory)) private categories;
    mapping(uint256 => mapping(address => uint32)) private walletPurchases;


    // Event
    // event digunakan untuk menuliskan log langsung ke dalam blockchain
    event EventCreated(uint256 indexed eventId, address indexed organizer, uint64 eventTimestamp, uint32 maxPerWallet);
    event CategoryCreated(uint256 indexed eventId, uint256 indexed categoryId, uint96 price, uint32 quota);
    event TicketMinted(uint256 indexed tokenId, uint256 indexed eventId, uint256 categoryId, address indexed buyer, uint96 price);
    event TicketUsed(uint256 indexed tokenId, address indexed scanner, uint64 timestamp);

    // Constructor
    // constructor akan berisi apa nama dari token ERC 721 (NFT) yang dibuat
    constructor() ERC721("NFTix", "NFTIX") Ownable(msg.sender) {
        
    }

    function createEvent(uint256 eventId,
        address organizer,
        uint64  eventTimestamp,
        uint32  maxPerWallet) external onlyOwner{
        if(eventId==0){ // jika tidak ada event id maka revert
            revert ForbiddenZero();
        }
        if(organizer==address(0)){ // jika tidak ada organizer maka revert
            revert EmptyIssuerWalletAddress();
        }
        if(eventTimestamp<=block.timestamp){ // kalau tanggal event lebih awal daripada pembuatan tiket maka revert
            revert EventAlreadyPassed();
        }
        if(maxPerWallet==0){ // jika jumlah maksimal pembelian tiket per wallet adalah 0, amka revert
            revert ForbiddenZero();
        }
        if (events[eventId].exists){
            revert EventAlreadyExists(eventId);
        }

        // masukkan nilai ke EventInfo
        events[eventId] = EventInfo({
            exists: true,
            organizer: organizer,
            eventTimestamp: eventTimestamp,
            maxPerWallet: maxPerWallet,
            salesOpen: true
        });

        // emit log event
        emit EventCreated(eventId, organizer, eventTimestamp, maxPerWallet);

        
    }

    function addCategory( uint256 eventId,
    uint256 categoryId,
    uint96  price,
    uint32  quota) external onlyOwner{
        if (!events[eventId].exists) {
            revert EventNotFound(eventId);
        }
        if (categoryId == 0 || quota == 0 || price == 0) {
            revert ForbiddenZero();
        }
        if (categories[eventId][categoryId].exists) {
            revert CategoryAlreadyExist(eventId, categoryId);
        }

        // masukkan nilai ke Category
        categories[eventId][categoryId] = TicketCategory({
            exists: true,
            price: price,
            quota: quota,
            minted: 0
        });

        // emit log event untuk category
        emit CategoryCreated(eventId, categoryId, price, quota);

    }

    function setSalesOpen(uint256 eventId, bool open) external {
        if(!events[eventId].exists){
            revert EventNotFound(eventId);
        }
        // hanya organizer yang boleh membuka penjualan
        if(msg.sender != events[eventId].organizer && msg.sender != owner()){
            revert NotAuthorized();
        }
        events[eventId].salesOpen = open; // modify salesOpen
    }

    function setMarketplace(address _marketplace) public onlyOwner{
        if (_marketplace == address(0)){
            revert ForbiddenZero();
        }
        // mengubah alamat marketplace
        marketplaceAddress = _marketplace;
    }
    function setSystemSigner(address _signer) public onlyOwner{
        if(_signer == address(0)){
            revert ForbiddenZero();
        }

        // mengubah sistem signer menjadi signer yg benar
        systemSigner = _signer;
    }

    function mintTicket(address to, uint256 eventId, uint256 categoryId) external returns (uint256){
        if (to == address(0)){ // cek apakah alamat penerima adalah address kosong
            revert ForbiddenZero();
        }
        if(!events[eventId].exists){ // cek apakah event sudah dibuat
            revert EventNotFound(eventId);
        }
        if (!events[eventId].salesOpen) { // cek apakah penjualan sudah dibuka
            revert SalesClosed();
        }
        if (!categories[eventId][categoryId].exists) { // cek apakah kategori sudah dibuat
            revert CategoryNotFound(eventId, categoryId);
        }
        TicketCategory storage cat = categories[eventId][categoryId]; // buat penyimpanan sementara untuk mengakses data category
        if (cat.minted >= cat.quota) { // cek apakah kuota sudah habis
            revert QuotaExceeded();
        }
        if (walletPurchases[eventId][to] >= events[eventId].maxPerWallet) { // cek apakah pembelian sudah melebihi batas per wallet
            revert MaxPerWalletExceeded();
        }

        // Increment id token * update kuota tiket ketika terjual
        _nextTokenId++;
        uint256 tokenId = _nextTokenId;
        cat.minted++; // update jumlah tiket terjual
        walletPurchases[eventId][to]++; // update jumlah tiket yang dibeli oleh wallet

        // Kunci harga asli saat minting (anti markup / calo)
        uint96 price = cat.price;


        // simpan data ticket
        _tickets[tokenId] = TicketInfo({
            eventId: eventId,
            categoryId: categoryId,
            originalPrice: price,
            used: false
        });

        
        // Mint NFT (ERC721)
        _safeMint(to, tokenId); // mint ke alamat 'to'

        emit TicketMinted(tokenId, eventId, categoryId, to, price);
        
        return tokenId;
    }

    function markUsed(uint256 tokenId) external{
        address tokenOwner = _ownerOf(tokenId);
        if(tokenOwner == address(0)){ // cek apakah tokenId valid
            revert TicketNotFound(tokenId);
        }
        if(_tickets[tokenId].used){
            revert TicketAlreadyUsed(tokenId);
        }

        // hanya pemilik tiekt, organizer dan system signer yang boleh redeem ticket (update status markUsed)
       uint256 eventId = _tickets[tokenId].eventId;
       if (msg.sender != tokenOwner && msg.sender != events[eventId].organizer && msg.sender != owner()){
        revert NotAuthorized();
       }
       _tickets[tokenId].used=true; // update status menjadi sudah dipakai
       emit TicketUsed(tokenId, msg.sender, uint64(block.timestamp)); // emit = mengirimkan tulisan bahwa tiket sudha diredeem
    }

    // membaca halaman "My Ticket" dan "Verify Ticket"
    function getTicket(uint256 tokenId) external view returns (TicketInfo memory){
        if (_ownerOf(tokenId) == address(0)) revert TicketNotFound(tokenId);
        return _tickets[tokenId];
    }



    
}