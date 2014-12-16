<?xml version="1.0" encoding="UTF-8"?>
<xsl:stylesheet version="1.0"
                xmlns:xsl="http://www.w3.org/1999/XSL/Transform"
                xmlns:gmd="http://www.isotc211.org/2005/gmd"
                xmlns:gco="http://www.isotc211.org/2005/gco"
                xmlns:xlink="http://www.w3.org/1999/xlink"
                xmlns:gmdl="http://www.canada.gc.ca/ns/gmdl"
                xmlns:napec="http://www.ec.gc.ca/data_donnees/standards/schemas/napec"
                xmlns:gml="http://www.opengis.net/gml"
                xmlns:geonet="http://www.fao.org/geonetwork"
                xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
                xsi:schemaLocation="http://www.ec.gc.ca/data_donnees/standards/schemas/napec/schema.xsd">

  <xsl:param name="catalogue_url" />

  <xsl:decimal-format NaN=""/>

  <xsl:template match="/">

    <div class="metadata-view">

      <xsl:if test="//gmd:abstract//gmd:LocalisedCharacterString[@locale='#FRE']/text() != ''">
        <h5 class="margin-bottom-none margin-top-small">Résumé</h5>
        <p class="shorten-candidate margin-top-none margin-bottom-medium">
          <xsl:value-of select="//gmd:abstract//gmd:LocalisedCharacterString[@locale='#FRE']/text()" />
        </p>
      </xsl:if>

      <xsl:comment>
        <h5 class="margin-bottom-none margin-top-small">Portée</h5>
        <p class="shorten-candidate margin-top-none margin-bottom-medium">
          here be scope
        </p>
      </xsl:comment>

      <xsl:if test="//gml:TimePeriod//* != ''">
        <h5 class="margin-bottom-none margin-top-small">Période</h5>
        <p class="shorten-candidate margin-top-none margin-bottom-medium">
          <xsl:value-of select="//gml:TimePeriod//gml:beginPosition" />
          <xsl:if test="//gml:TimePeriod//gml:beginPosition/text() != '' and //gml:TimePeriod//gml:endPosition/text() != ''">
            -
          </xsl:if>
          <xsl:value-of select="//gml:TimePeriod//gml:endPosition" />
        </p>
      </xsl:if>

      <xsl:comment>
        <xsl:if test="//gmd:supplementalInformation//gmd:LocalisedCharacterString[@locale='#FRE']/text() != ''">
          <h5 class="margin-bottom-none margin-top-small">Données supplémentaires</h5>
          <p class="shorten-candidate margin-top-none margin-bottom-medium">
            <xsl:value-of select="//gmd:supplementalInformation//gmd:LocalisedCharacterString[@locale='#FRE']/text()" />
          </p>
        </xsl:if>
      </xsl:comment>

      <xsl:if test="//gmd:pointOfContact//gmd:individualName/* != '' 
              or //gmd:pointOfContact//gmd:organisationName//gmd:LocalisedCharacterString[@locale='#FRE']/text() != ''
              or //gmd:pointOfContact//gmd:positionName//gmd:LocalisedCharacterString[@locale='#FRE']/text() != ''
              or //gmd:pointOfContact//gmd:electronicMailAddress/* != ''
              or //gmd:pointOfContact//gmd:role/gmd:CI_RoleCode/@codeListValue != ''">
        <h5 class="margin-bottom-none margin-top-small">Coordonnées</h5>
        <p class="shorten-candidate margin-top-none margin-bottom-medium">
          <xsl:value-of select="//gmd:pointOfContact//gmd:individualName" />
        </p>
        <p class="shorten-candidate margin-top-none margin-bottom-medium">
          <xsl:value-of select="//gmd:pointOfContact//gmd:organisationName//gmd:LocalisedCharacterString[@locale='#FRE']/text()" />
        </p>
        <p class="shorten-candidate margin-top-none margin-bottom-medium">
          <xsl:value-of select="//gmd:pointOfContact//gmd:positionName//gmd:LocalisedCharacterString[@locale='#FRE']/text()" />
        </p>
        <p class="shorten-candidate margin-top-none margin-bottom-medium">
          <a href="mailto:{//gmd:pointOfContact//gmd:electronicMailAddress}?Subject={//gmd:identificationInfo//gmd:title//gmd:LocalisedCharacterString/text()}">
            <xsl:value-of select="//gmd:pointOfContact//gmd:electronicMailAddress" />
          </a>
        </p>
        <p class="shorten-candidate margin-top-none margin-bottom-medium">
          <xsl:variable name="roleCode" >
            <xsl:value-of select="concat(substring(//gmd:pointOfContact//gmd:role/gmd:CI_RoleCode/@codeListValue,1,1),
                        substring(//gmd:pointOfContact//gmd:role/gmd:CI_RoleCode/@codeListValue, 2))" />
          </xsl:variable>

          <xsl:choose>
            <xsl:when test="$roleCode = 'resourceProvider'">Fournisseur Ressource</xsl:when>
            <xsl:when test="$roleCode = 'custodian'">Conservateur</xsl:when>
            <xsl:when test="$roleCode = 'owner'">Propriétaire</xsl:when>
            <xsl:when test="$roleCode = 'user'">Utilisateur</xsl:when>
            <xsl:when test="$roleCode = 'distributor'">Distributeur</xsl:when>
            <xsl:when test="$roleCode = 'originator'">Auteur</xsl:when>
            <xsl:when test="$roleCode = 'pointOfContact'">Contact</xsl:when>
            <xsl:when test="$roleCode = 'principalInvestigator'">Chercheur Principal</xsl:when>
            <xsl:when test="$roleCode = 'processor'">Traiteur</xsl:when>
            <xsl:when test="$roleCode = 'publisher'">Éditeur</xsl:when>
            <xsl:when test="$roleCode = 'author'">Auteur</xsl:when>
            <xsl:when test="$roleCode = 'collaborator'">Collaborateur</xsl:when>
            <xsl:when test="$roleCode = 'editor'">Réviseur</xsl:when>
            <xsl:when test="$roleCode = 'mediator'">Médiateur</xsl:when>
            <xsl:when test="$roleCode = 'rightsHolder'">DétenteurDroits</xsl:when>
          </xsl:choose>
        </p>
      </xsl:if>

      <xsl:if test="$catalogue_url != ''">
        <h5 class="margin-bottom-none margin-top-small">Page du catalogue de données</h5>
        <p class="shorten-candidate margin-top-none margin-bottom-medium">
          <a href="{$catalogue_url}"
             rel="external" target="_blank" class="ui-link">
            Métadonnées
          </a>
        </p>
      </xsl:if>
    </div>
  </xsl:template>
</xsl:stylesheet>