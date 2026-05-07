package com.tmdt.web.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@AllArgsConstructor
@NoArgsConstructor
@Data
@Table(name = "users")
public class User {
    public enum Gender {
        male, female
    }

    public enum RoleAcc {
        student, tutor, admin
    }

    public enum Provider {
        LOCAL, FACEBOOK, GOOGLE
    }

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private int id;
    private String email;
    private String password;
    private String fullName;
    private String phone;
    private String avatar;

    @Enumerated(EnumType.STRING)
    private Gender gender;
    @Enumerated(EnumType.STRING)
    private RoleAcc role;
    @Enumerated(EnumType.STRING)
    private Provider provider;


}