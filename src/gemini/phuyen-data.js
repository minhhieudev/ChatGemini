/**
 * Dữ liệu về trường Đại học Phú Yên và thông tin tuyển sinh
 * Dữ liệu này sẽ được sử dụng để cung cấp thông tin cho chatbot tư vấn tuyển sinh
 * Dữ liệu mẫu - cần được cập nhật với thông tin chính xác từ trường Đại học Phú Yên
 */

const PHU_YEN_UNIVERSITY_DATA = {
  thongTinChung: {
    ten: "Trường Đại học Phú Yên",
    diaChi: "01 Nguyễn Văn Huyên, Phường 9, Tp. Tuy Hòa, Tỉnh Phú Yên",
    website: "http://www.pyu.edu.vn",
    email: "daihocphuyen@pyu.edu.vn",
    dienThoai: "0257 3843 867",
    maHieuTruong: "TS. Lê Quân",
    namThanhLap: "2011",
    logo: "https://upload.wikimedia.org/wikipedia/vi/c/c0/Logo_Dai_hoc_Phu_Yen.png",
    lichSu: `Trường Đại học Phú Yên được thành lập theo Quyết định số 1233/QĐ-TTg ngày 25/7/2011 của Thủ tướng Chính phủ trên cơ sở nâng cấp Trường Cao đẳng Sư phạm Phú Yên. Tiền thân của Trường là Trường Sư phạm cấp 3 Phú Khánh được thành lập ngày 04/06/1962 tại thị xã Tuy Hòa, tỉnh Phú Yên.`,
    tamNhin: "Đến năm 2030, Trường Đại học Phú Yên phấn đấu trở thành trường đại học đa ngành, đa lĩnh vực, đáp ứng nhu cầu đào tạo nguồn nhân lực chất lượng cao cho tỉnh Phú Yên và khu vực Nam Trung Bộ.",
    suMenh: "Đào tạo nguồn nhân lực có trình độ đại học và sau đại học; nghiên cứu khoa học, chuyển giao công nghệ và hợp tác quốc tế, đáp ứng yêu cầu phát triển kinh tế - xã hội của tỉnh Phú Yên và khu vực Nam Trung Bộ.",
  },
  
  nganhDaoTao: [
    {
      tenNganh: "Giáo dục Mầm non",
      maNganh: "7140201",
      moTa: "Đào tạo giáo viên có kiến thức và kỹ năng về chăm sóc, giáo dục trẻ em từ 3 tháng đến 6 tuổi.",
      toHopXetTuyen: ["A01", "C01", "D01"],
      chiTieu: 100,
      hocPhi: "12.000.000 đồng/năm",
      diemChuan2023: 19.5,
      khoiLuongKienThuc: "130 tín chỉ",
      thoiGianDaoTao: "4 năm",
      coHoiViecLam: "Làm việc tại các trường mầm non công lập và tư thục, các trung tâm giáo dục mầm non."
    },
    {
      tenNganh: "Giáo dục Tiểu học",
      maNganh: "7140202",
      moTa: "Đào tạo giáo viên có kiến thức và kỹ năng giảng dạy cho học sinh tiểu học.",
      toHopXetTuyen: ["A01", "C01", "D01"],
      chiTieu: 120,
      hocPhi: "12.000.000 đồng/năm",
      diemChuan2023: 20.0,
      khoiLuongKienThuc: "135 tín chỉ",
      thoiGianDaoTao: "4 năm",
      coHoiViecLam: "Làm việc tại các trường tiểu học công lập và tư thục, các trung tâm giáo dục."
    },
    {
      tenNganh: "Sư phạm Toán học",
      maNganh: "7140209",
      moTa: "Đào tạo giáo viên dạy môn Toán ở bậc THCS và THPT.",
      toHopXetTuyen: ["A00", "A01", "B00"],
      chiTieu: 80,
      hocPhi: "12.000.000 đồng/năm",
      diemChuan2023: 21.5,
      khoiLuongKienThuc: "135 tín chỉ",
      thoiGianDaoTao: "4 năm",
      coHoiViecLam: "Giáo viên toán tại các trường THCS, THPT hoặc làm việc tại các tổ chức giáo dục."
    },
    {
      tenNganh: "Sư phạm Ngữ văn",
      maNganh: "7140217",
      moTa: "Đào tạo giáo viên dạy môn Ngữ văn ở bậc THCS và THPT.",
      toHopXetTuyen: ["C00", "D01", "D14"],
      chiTieu: 80,
      hocPhi: "12.000.000 đồng/năm",
      diemChuan2023: 20.5,
      khoiLuongKienThuc: "135 tín chỉ",
      thoiGianDaoTao: "4 năm",
      coHoiViecLam: "Giáo viên ngữ văn tại các trường THCS, THPT hoặc làm việc tại các tổ chức giáo dục, báo chí."
    },
    {
      tenNganh: "Sư phạm Tiếng Anh",
      maNganh: "7140231",
      moTa: "Đào tạo giáo viên dạy môn Tiếng Anh ở bậc THCS và THPT.",
      toHopXetTuyen: ["D01", "D14", "D15"],
      chiTieu: 100,
      hocPhi: "12.000.000 đồng/năm",
      diemChuan2023: 22.0,
      khoiLuongKienThuc: "135 tín chỉ",
      thoiGianDaoTao: "4 năm",
      coHoiViecLam: "Giáo viên tiếng Anh tại các trường học, trung tâm ngoại ngữ, biên phiên dịch."
    },
    {
      tenNganh: "Quản trị kinh doanh",
      maNganh: "7340101",
      moTa: "Đào tạo cử nhân có kiến thức và kỹ năng về quản trị, điều hành doanh nghiệp.",
      toHopXetTuyen: ["A00", "A01", "D01"],
      chiTieu: 150,
      hocPhi: "15.000.000 đồng/năm",
      diemChuan2023: 18.0,
      khoiLuongKienThuc: "130 tín chỉ",
      thoiGianDaoTao: "4 năm",
      coHoiViecLam: "Làm việc tại các doanh nghiệp, tổ chức kinh tế, hoặc tự khởi nghiệp."
    },
    {
      tenNganh: "Kế toán",
      maNganh: "7340301",
      moTa: "Đào tạo cử nhân có kiến thức và kỹ năng về kế toán, kiểm toán và tài chính.",
      toHopXetTuyen: ["A00", "A01", "D01"],
      chiTieu: 120,
      hocPhi: "15.000.000 đồng/năm",
      diemChuan2023: 17.5,
      khoiLuongKienThuc: "130 tín chỉ",
      thoiGianDaoTao: "4 năm",
      coHoiViecLam: "Làm việc tại bộ phận kế toán của các doanh nghiệp, tổ chức tài chính."
    },
    {
      tenNganh: "Công nghệ thông tin",
      maNganh: "7480201",
      moTa: "Đào tạo kỹ sư công nghệ thông tin có khả năng thiết kế, xây dựng và phát triển các hệ thống phần mềm.",
      toHopXetTuyen: ["A00", "A01", "D01"],
      chiTieu: 150,
      hocPhi: "17.000.000 đồng/năm",
      diemChuan2023: 19.0,
      khoiLuongKienThuc: "145 tín chỉ",
      thoiGianDaoTao: "4 năm",
      coHoiViecLam: "Lập trình viên, kỹ sư phần mềm, chuyên gia CNTT tại các công ty phần mềm, doanh nghiệp."
    },
    {
      tenNganh: "Du lịch",
      maNganh: "7810101",
      moTa: "Đào tạo cử nhân có kiến thức và kỹ năng về lĩnh vực du lịch, khách sạn, nhà hàng.",
      toHopXetTuyen: ["C00", "D01", "D15"],
      chiTieu: 100,
      hocPhi: "15.000.000 đồng/năm",
      diemChuan2023: 18.0,
      khoiLuongKienThuc: "130 tín chỉ",
      thoiGianDaoTao: "4 năm",
      coHoiViecLam: "Làm việc tại các công ty du lịch, khách sạn, khu nghỉ dưỡng, nhà hàng."
    }
  ],
  
  thongTinTuyenSinh2024: {
    phuongThucXetTuyen: [
      {
        ten: "Xét tuyển theo kết quả thi tốt nghiệp THPT năm 2024",
        moTa: "Sử dụng kết quả kỳ thi tốt nghiệp THPT năm 2024 để xét tuyển.",
        tyLe: "70%",
        dieuKien: "Tốt nghiệp THPT, đạt ngưỡng điểm đảm bảo chất lượng đầu vào."
      },
      {
        ten: "Xét tuyển học bạ THPT",
        moTa: "Xét tuyển dựa trên kết quả học tập trong học bạ THPT.",
        tyLe: "20%",
        dieuKien: "Tốt nghiệp THPT, điểm trung bình chung học tập 3 năm THPT từ 6.5 trở lên."
      },
      {
        ten: "Xét tuyển thẳng",
        moTa: "Xét tuyển thẳng theo quy chế của Bộ GD&ĐT.",
        tyLe: "10%",
        dieuKien: "Đạt giải trong các kỳ thi học sinh giỏi quốc gia, quốc tế hoặc các đối tượng theo quy định của Bộ GD&ĐT."
      }
    ],
    toHopXetTuyen: {
      A00: "Toán - Vật lý - Hóa học",
      A01: "Toán - Vật lý - Tiếng Anh",
      B00: "Toán - Hóa học - Sinh học",
      C00: "Ngữ văn - Lịch sử - Địa lý",
      C01: "Ngữ văn - Toán - Vật lý",
      D01: "Ngữ văn - Toán - Tiếng Anh",
      D14: "Ngữ văn - Toán - Lịch sử",
      D15: "Ngữ văn - Toán - Địa lý"
    },
    hocPhi: {
      nhomNganhSuPham: "12.000.000 đồng/năm",
      nhomNganhKinhTe: "15.000.000 đồng/năm",
      nhomNganhKyThuat: "17.000.000 đồng/năm"
    },
    thoiGianXetTuyen: {
      dotDau: "Từ ngày 20/7/2024 đến ngày 31/8/2024",
      dotBoSung: "Từ ngày 10/9/2024 đến ngày 30/9/2024 (nếu còn chỉ tiêu)"
    },
    chiTieuTuyenSinh: 1000,
    thongTinLienHe: {
      phongTuyenSinh: "Phòng Đào tạo - Trường Đại học Phú Yên",
      diaChiLienHe: "01 Nguyễn Văn Huyên, Phường 9, Tp. Tuy Hòa, Tỉnh Phú Yên",
      dienThoai: "0257 3843 867",
      email: "tuyensinh@pyu.edu.vn",
      website: "http://www.pyu.edu.vn"
    }
  },
  
  hocBong: [
    {
      ten: "Học bổng khuyến khích học tập",
      moTa: "Dành cho sinh viên có kết quả học tập và rèn luyện tốt.",
      giaTriToiDa: "5.000.000 đồng/học kỳ",
      doiTuong: "Sinh viên có kết quả học tập đạt loại giỏi, xuất sắc."
    },
    {
      ten: "Học bổng tân sinh viên",
      moTa: "Dành cho tân sinh viên có điểm đầu vào cao.",
      giaTriToiDa: "10.000.000 đồng/năm",
      doiTuong: "Tân sinh viên đạt điểm cao trong kỳ thi tốt nghiệp THPT."
    },
    {
      ten: "Học bổng chính sách",
      moTa: "Dành cho sinh viên thuộc diện chính sách, vùng khó khăn.",
      giaTriToiDa: "Theo quy định của Nhà nước",
      doiTuong: "Sinh viên dân tộc thiểu số, vùng khó khăn, vùng đặc biệt khó khăn."
    }
  ],
  
  coSoVatChat: {
    giangDuong: "5 tòa nhà với hơn 100 phòng học hiện đại, trang bị đầy đủ thiết bị giảng dạy",
    phongThiNghiem: "20 phòng thí nghiệm và thực hành chuyên ngành",
    thuVien: "Thư viện với hơn 50.000 đầu sách, tài liệu điện tử và không gian học tập",
    kyTucXa: "Ký túc xá với sức chứa 1.500 sinh viên, đầy đủ tiện nghi sinh hoạt",
    theThao: "Sân vận động, nhà thi đấu đa năng, sân bóng đá, bóng chuyền, cầu lông",
    canTin: "Căn tin phục vụ ăn uống với giá cả hợp lý cho sinh viên",
    internet: "Hệ thống wifi phủ sóng toàn trường, phòng máy tính kết nối internet tốc độ cao"
  },
  
  hoatDongSinhVien: [
    "Câu lạc bộ học thuật và nghiên cứu khoa học",
    "Đội thanh niên tình nguyện",
    "Câu lạc bộ văn nghệ, thể thao",
    "Hội sinh viên các tỉnh, thành phố",
    "Hoạt động tình nguyện, thiện nguyện",
    "Cuộc thi học thuật, văn hóa, nghệ thuật",
    "Giao lưu sinh viên quốc tế"
  ],
  
  lienKetQuocTe: [
    "Hợp tác đào tạo với các trường đại học tại Hàn Quốc, Nhật Bản",
    "Chương trình trao đổi sinh viên với các trường đại học trong khu vực ASEAN",
    "Liên kết nghiên cứu với các tổ chức quốc tế"
  ],
  
  chuongTrinhDacBiet: [
    {
      ten: "Chương trình đào tạo chất lượng cao",
      moTa: "Đào tạo theo chuẩn quốc tế, giảng dạy bằng tiếng Anh.",
      nganhDaoTao: ["Quản trị kinh doanh", "Công nghệ thông tin"]
    },
    {
      ten: "Chương trình liên kết đào tạo quốc tế",
      moTa: "Học 2 năm tại Việt Nam, 2 năm tại nước ngoài, nhận bằng quốc tế.",
      nganhDaoTao: ["Quản trị kinh doanh", "Du lịch"]
    }
  ]
};

export default PHU_YEN_UNIVERSITY_DATA; 