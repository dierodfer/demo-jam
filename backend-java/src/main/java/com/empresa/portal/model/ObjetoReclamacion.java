package com.empresa.portal.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

/** Reclamación de un empleado sobre un objeto publicado por otro. */
@Entity
@Table(name = "objeto_reclamacion")
public class ObjetoReclamacion {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id")
    private Long id;

    @Column(name = "objeto_id")
    private Long objetoId;

    @Column(name = "reclamante_id")
    private Long reclamanteId;

    @Column(name = "mensaje")
    private String mensaje;

    @Column(name = "estado")
    private String estado;

    @Column(name = "fecha")
    private String fecha;

    public ObjetoReclamacion() {
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Long getObjetoId() {
        return objetoId;
    }

    public void setObjetoId(Long objetoId) {
        this.objetoId = objetoId;
    }

    public Long getReclamanteId() {
        return reclamanteId;
    }

    public void setReclamanteId(Long reclamanteId) {
        this.reclamanteId = reclamanteId;
    }

    public String getMensaje() {
        return mensaje;
    }

    public void setMensaje(String mensaje) {
        this.mensaje = mensaje;
    }

    public String getEstado() {
        return estado;
    }

    public void setEstado(String estado) {
        this.estado = estado;
    }

    public String getFecha() {
        return fecha;
    }

    public void setFecha(String fecha) {
        this.fecha = fecha;
    }
}
