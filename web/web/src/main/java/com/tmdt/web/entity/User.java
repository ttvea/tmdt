package com.tmdt.web.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "users")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class User {

    public enum Gender {
        MALE,
        FEMALE
    }

    public enum RoleAcc {
        STUDENT,
        TUTOR,
        ADMIN
    }

    public enum Provider {
        LOCAL,
        FACEBOOK,
        GOOGLE
    }

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @Column(nullable = false, unique = true)
    private String email;

    @Column(nullable = true)
    private String password;

    @Column(nullable = false)
    private String fullName;

    private String phone;

    private String avatar;

    private Integer birthday;

    @Convert(converter = GenderConverter.class)
    private Gender gender;

    @Convert(converter = RoleAccConverter.class)
    private RoleAcc role;

    @Convert(converter = ProviderConverter.class)
    private Provider provider;

    private String providerId;

    private Boolean enabled = true;

    private Boolean verified = false;

    private LocalDateTime createdAt;

    private LocalDateTime updatedAt;

    @PrePersist
    public void prePersist() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
    }

    @PreUpdate
    public void preUpdate() {
        updatedAt = LocalDateTime.now();
    }

    @Converter(autoApply = false)
    public static class GenderConverter implements AttributeConverter<Gender, String> {
        @Override
        public String convertToDatabaseColumn(Gender gender) {
            return gender != null ? gender.name().toLowerCase() : null;
        }

        @Override
        public Gender convertToEntityAttribute(String gender) {
            if (gender == null || gender.isBlank()) {
                return null;
            }

            try {
                return Gender.valueOf(gender.trim().toUpperCase());
            } catch (IllegalArgumentException exception) {
                return null;
            }
        }
    }

    @Converter(autoApply = false)
    public static class RoleAccConverter implements AttributeConverter<RoleAcc, String> {
        @Override
        public String convertToDatabaseColumn(RoleAcc role) {
            return role != null ? role.name().toLowerCase() : null;
        }

        @Override
        public RoleAcc convertToEntityAttribute(String role) {
            if (role == null || role.isBlank()) {
                return null;
            }

            try {
                return RoleAcc.valueOf(role.trim().toUpperCase());
            } catch (IllegalArgumentException exception) {
                return RoleAcc.STUDENT;
            }
        }
    }

    @Converter(autoApply = false)
    public static class ProviderConverter implements AttributeConverter<Provider, String> {
        @Override
        public String convertToDatabaseColumn(Provider provider) {
            return provider != null ? provider.name() : null;
        }

        @Override
        public Provider convertToEntityAttribute(String provider) {
            if (provider == null || provider.isBlank()) {
                return null;
            }

            try {
                return Provider.valueOf(provider.trim().toUpperCase());
            } catch (IllegalArgumentException exception) {
                return Provider.LOCAL;
            }
        }
    }
}
