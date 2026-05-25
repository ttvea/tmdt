# Backend Fix for Image Messages

## Problem
Khi gửi ảnh, backend tạo Message với chỉ `imageUrl`, mà không set `content`. Khi `content` là NULL, frontend không biết có phải tin nhắn ảnh hay không.

## Current Backend Code
```java
Message message = Message.builder()
    .conversation(conversation)
    .sender(sender)
    .imageUrl(imageUrl)
    .build();
```

## Fix Option 1: Set empty content (RECOMMENDED)
```java
Message message = Message.builder()
    .conversation(conversation)
    .sender(sender)
    .content("")  // Thêm dòng này
    .imageUrl(imageUrl)
    .build();
```

## Fix Option 2: Ensure DTO maps image_url to response
Kiểm tra MessageResponse DTO có include `image_url` field không, và đảm bảo nó được serialize ra JSON.

Example DTO:
```java
@Data
@Builder
public class MessageResponse {
    private Long id;
    private Integer senderId;
    private String senderName;
    private String senderAvatar;
    private String content;
    private String imageUrl;  // Đảm bảo field này có @JsonProperty("image_url")
    private Boolean isRead;
    private LocalDateTime createdAt;
}
```

## What Frontend Did
Frontend đã update `getConversationMessages()` để normalize cả `imageUrl` lẫn `image_url` từ response, và sẽ render ảnh nếu có `imageUrl`.

Frontend hiện có debug logging, check DevTools Console khi load tin nhắn để xem response shape.
