module.exports = {
  extends: ['@commitlint/config-conventional'],
  rules: {
    'type-enum': [
      2,
      'always',
      [
        'feat',     // Tính năng mới
        'fix',      // Sửa lỗi
        'docs',     // Thêm/sửa tài liệu
        'style',    // Format code (không đổi logic)
        'refactor', // Tái cấu trúc code
        'perf',     // Tối ưu hiệu năng
        'test',     // Thêm/sửa test
        'build',    // Thay đổi config build
        'ci',       // Thay đổi CI/CD
        'chore',    // Cập nhật linh tinh
        'revert'    // Revert commit
      ]
    ],
    'subject-case': [0, 'never'] // Tắt bắt buộc viết thường chữ cái đầu
  }
};
