/*
 * Copyright by LunaSec (owned by Refinery Labs, Inc)
 *
 * Licensed under the Business Source License v1.1
 * (the "License"); you may not use this file except in compliance with the
 * License. You may obtain a copy of the License at
 *
 * https://github.com/lunasec-io/lunasec/blob/master/licenses/BSL-LunaTrace.txt
 *
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 */
import React, {MouseEventHandler, useState} from 'react';
import {Card, Col, Collapse, Container, Fade, Row, Table, Accordion, OverlayTrigger, Tooltip} from 'react-bootstrap';
import semverSort from 'semver-sort'

import {prettyDate} from '../../../../utils/pretty-date';
import {VulnerablePackage} from "./types";
import {ChevronDown, ChevronUp, Copy} from "react-feather";
import {severityOrder} from "./types";
import {useNavigate} from "react-router-dom";

interface FindingListItemProps {
    pkg: VulnerablePackage;
    severityFilter: number;
}

export const VulnerablePackageItem: React.FunctionComponent<FindingListItemProps> = ({pkg, severityFilter}) => {
    const navigate = useNavigate();
    const createdAt = prettyDate(new Date(pkg.created_at as string));
    // const [filterLevel, setFilterLevel] = useState(severityFilter)
    const [shouldFilterFindings, setShouldFilterFindings] = useState(true);
    const filteredFindings = pkg.findings.filter((f) => {
        return severityOrder.indexOf(f.severity) >= severityFilter || !shouldFilterFindings;
    })

    const fixVersions = [...pkg.fix_versions];

    // if (!fixVersions.some((f) => isNaN(Number(f)))){
    //     console.log('using number sort ', pkg.fix_versions)
    //     // attempt to sort using number conversion
    //     fixVersions.sort((a,b) => Number(b) - Number(a))
    //     console.log('sorted versions are ', fixVersions)
    // } else {
    //     console.log('falling back to string sort for ', pkg.fix_versions)
    //     fixVersions.sort();
    // }

    const recommendVersion = semverSort.desc(fixVersions)[0]

    const renderCvssInferredWarning = (inferred:boolean) => {
        if (!inferred) {
            return null;
        }
        return (
            <OverlayTrigger
                placement="left"
                overlay={<Tooltip>This CVSS score has been inferred from a linked NVD vulnerability.</Tooltip>}
            >
                <Copy size="12" />
            </OverlayTrigger>
        );
    };

    return (
        <Card className="vulnpkg-card">
            <Card.Header>
                <Container fluid>
                    <Row>
                        <Col sm="6">
                            <Card.Title>
                                <h3>
                                    {pkg.package_name}{' '}
                                </h3>
                            </Card.Title>
                            <Card.Subtitle> <span className="darker">Version: </span>{pkg.version}</Card.Subtitle>
                        </Col>
                        <Col sm={{span: 6}}>
                            <div style={{float: 'right', textAlign: 'right'}}>
                                <Card.Title>
                                    <span className="text-right darker"> Severity: </span>
                                    <h4 style={{display: 'inline'}}>{pkg.severity}</h4>

                                </Card.Title>
                                {pkg.cvss_score ? <Card.Subtitle> <span className="darker">CVSS: </span>{pkg.cvss_score}
                                </Card.Subtitle> : null}

                            </div>
                        </Col>
                    </Row>
                </Container>
            </Card.Header>
            <Card.Body>
                <Container fluid>
                    {pkg.fix_state === 'fixed' ? <Row>
                        <h5> <span className="darker">Recommended version: </span>{recommendVersion}</h5>
                    </Row> : null}
                    <Row>
                        <Col xs="12">
                            <h5
                                className="darker">Path{pkg.locations.length === 1 ? '' : 's'}:</h5> {pkg.locations.map((l) => {
                                    return <>
                                        <h5>{l}</h5>
                                    </>
                            })}

                        </Col>
                    </Row>

                    <Row>
                        <Accordion>
                            <Accordion.Item eventKey="0">
                                <Accordion.Header>{filteredFindings.length} {shouldFilterFindings ? severityOrder[severityFilter] : null} finding{filteredFindings.length === 1 ? '' : 's'}</Accordion.Header>
                                <Accordion.Body>
                                    <Table hover size="sm">
                                        <thead>
                                        <tr>
                                            <th>Source</th>
                                            <th>Vulnerability Number</th>
                                            <th>Severity</th>
                                            <th>CVSS</th>
                                            <th>Fix</th>
                                        </tr>
                                        </thead>
                                        <tbody>
                                        {filteredFindings.map((f) => {
                                            return (
                                                <OverlayTrigger
                                                    placement="bottom"
                                                    overlay={<Tooltip className="wide-tooltip"> {f.vulnerability.description}</Tooltip>}
                                                    key={f.id}
                                                >
                                                    <tr style={{cursor:"pointer"}} onClick={() => navigate(`/vulnerabilities/${f.vulnerability.id}`)} key={f.id}>
                                                        <td>{f.vulnerability.namespace}</td>
                                                        <td>{f.vulnerability.name}</td>
                                                        <td>{f.severity}</td>
                                                        <td>{f.vulnerability.cvss_score} {renderCvssInferredWarning(f.vulnerability.cvss_inferred || false)}</td>
                                                        <td>{f.fix_versions || 'unknown'}</td>
                                                    </tr>
                                                </OverlayTrigger>


                                            )
                                        })}
                                        </tbody>
                                    </Table>
                                    {shouldFilterFindings ? (pkg.findings.length > filteredFindings.length ? <span style={{cursor: 'pointer'}}
                                                                  onClick={() => setShouldFilterFindings(false)}>
                                        Show {pkg.findings.length - filteredFindings.length} lower severity findings
                                        <ChevronDown/>
                                    </span>: null) :
                                        <span style={{cursor: 'pointer'}}
                                              onClick={() => setShouldFilterFindings(true)}>
                                        Hide lower severity findings
                                        <ChevronUp/>
                                    </span>}

                                </Accordion.Body>
                            </Accordion.Item>
                        </Accordion>
                    </Row>
                </Container>
            </Card.Body>
        </Card>
    )
    return null;
};
