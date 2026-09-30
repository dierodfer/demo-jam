package com.empresa.portal.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

/** Objeto perdido o encontrado publicado por un empleado. */
@Entity
@Table(name = "objeto_perdido")
public class ObjetoPerdido {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id")
    private Long id;

    @Column(name = "publicador_id")
    private Long publicadorId;

    @Column(name = "titulo")
    private String titulo;

    @Column(name = "descripcion")
    private String descripcion;

    @Column(name = "categoria")
    private String categoria;

    @Column(name = "tipo")
    private String tipo;

    @Column(name = "estado")
    private String estado;

    @Column(name = "seccion")
    private String seccion;

    @Column(name = "ubicacion")
    private String ubicacion;

    @Column(name = "fecha_suceso")
    private String fechaSuceso;

    @Column(name = "fecha_publicacion")
    private String fechaPublicacion;

    @Column(name = "fecha_entrega")
    private String fechaEntrega;

    @Column(name = "contraparte_id")
    private Long contraparteId;

    public ObjetoPerdido() {
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Long getPublicadorId() {
        return publicadorId;
    }

    public void setPublicadorId(Long publicadorId) {
        this.publicadorId = publicadorId;
    }

    public String getTitulo() {
        return titulo;
    }

    public void setTitulo(String titulo) {
        this.titulo = titulo;
    }

    public String getDescripcion() {
        return descripcion;
    }

    public void setDescripcion(String descripcion) {
        this.descripcion = descripcion;
    }

    public String getCategoria() {
        return categoria;
    }

    public void setCategoria(String categoria) {
        this.categoria = categoria;
    }

    public String getTipo() {
        return tipo;
    }

    public void setTipo(String tipo) {
        this.tipo = tipo;
    }

    public String getEstado() {
        return estado;
    }

    public void setEstado(String estado) {
        this.estado = estado;
    }

    public String getSeccion() {
        return seccion;
    }

    public void setSeccion(String seccion) {
        this.seccion = seccion;
    }

    public String getUbicacion() {
        return ubicacion;
    }

    public void setUbicacion(String ubicacion) {
        this.ubicacion = ubicacion;
    }

    public String getFechaSuceso() {
        return fechaSuceso;
    }

    public void setFechaSuceso(String fechaSuceso) {
        this.fechaSuceso = fechaSuceso;
    }

    public String getFechaPublicacion() {
        return fechaPublicacion;
    }

    public void setFechaPublicacion(String fechaPublicacion) {
        this.fechaPublicacion = fechaPublicacion;
    }

    public String getFechaEntrega() {
        return fechaEntrega;
    }

    public void setFechaEntrega(String fechaEntrega) {
        this.fechaEntrega = fechaEntrega;
    }

    public Long getContraparteId() {
        return contraparteId;
    }

    public void setContraparteId(Long contraparteId) {
        this.contraparteId = contraparteId;
    }
}
