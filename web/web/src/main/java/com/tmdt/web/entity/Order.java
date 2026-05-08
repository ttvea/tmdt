package com.tmdt.web.entity;

import jakarta.persistence.*;
import lombok.Data;

import java.util.Date;
import java.util.List;

@Entity
@Table(name = "orders")
@Data
public class Order {
    public enum OrderStatus {
        PENDING,
        PAID,
        CANCELLED,
        EXPIRED
    }
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

//    @ManyToOne
//    @JoinColumn(name = "student_id")
//    private Student student;
//
//    @ManyToOne
//    @JoinColumn(name = "course_id")
//    private Course course;

    private int studentId;
    private int courseId;

    private Double amount;

    @Enumerated(EnumType.STRING)
    private OrderStatus status;

    @Temporal(TemporalType.TIMESTAMP)
    private Date dateCreate;

    @OneToMany(mappedBy = "order")
    private List<Payment> payments;
}