import type {SimulatorInput} from '@live/shared';import type {EventService} from '../services/EventService.js';
export class MockConnector{constructor(private events:EventService){} emit(input:SimulatorInput){return this.events.simulate(input)}}
