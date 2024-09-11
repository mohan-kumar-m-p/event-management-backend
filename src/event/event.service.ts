import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EventType } from './enums/event-type.enum';
import { Event } from './event.entity';
import { EventSportGroup } from './enums/event-sport-group.enum';

@Injectable()
export class EventService {
  constructor(
    @InjectRepository(Event)
    private readonly eventRepository: Repository<Event>,
  ) {}

  async findAll(): Promise<Event[]> {
    const events = await this.eventRepository.find({
      where: {
        sportGroup: EventSportGroup.Athletics,
      },
    });
    if (!events) {
      throw new NotFoundException('No events found');
    }
    return events;
  }

  async findOne(id: string): Promise<Event> {
    const event = await this.eventRepository.findOne({
      where: { eventId: id },
      relations: ['rounds'],
    });
    if (!event) {
      throw new NotFoundException(`Event with ID ${id} not found`);
    }
    return event;
  }

  async findIndividualEvents(): Promise<{ [key: string]: Event[] }> {
    const individualEvents = await this.eventRepository.find({
      where: {
        type: EventType.Individual,
        sportGroup: EventSportGroup.Athletics,
      },
    });

    if (!individualEvents || individualEvents.length === 0) {
      throw new NotFoundException(`No individual events found`);
    }

    const groupedEvents = individualEvents.reduce(
      (acc, event) => {
        const sportGroup = event.sportGroup.toLowerCase();
        if (!acc[sportGroup]) {
          acc[sportGroup] = [];
        }
        acc[sportGroup].push(event);
        return acc;
      },
      {} as { [key: string]: Event[] },
    );

    return groupedEvents;
  }

  async findGroupEvents(): Promise<{ [key: string]: Event[] }> {
    const groupEvents = await this.eventRepository.find({
      where: { type: EventType.Group, sportGroup: EventSportGroup.Athletics },
    });

    if (!groupEvents || groupEvents.length === 0) {
      throw new NotFoundException(`No group events found`);
    }

    const groupedEvents = groupEvents.reduce(
      (acc, event) => {
        const sportGroup = event.sportGroup.toLowerCase();
        if (!acc[sportGroup]) {
          acc[sportGroup] = [];
        }
        acc[sportGroup].push(event);
        return acc;
      },
      {} as { [key: string]: Event[] },
    );

    return groupedEvents;
  }

  async findAllPastEvents(): Promise<any> {
    const pastEvents = await this.eventRepository.find({
      where: { completed: true },
    });
    if (!pastEvents || pastEvents.length === 0) {
      throw new NotFoundException(`No past events found`);
    }
    // Grouping events by type
    const groupedEvents = pastEvents.reduce(
      (acc, event) => {
        const type = event.type.toLowerCase();
        if (!acc[type]) {
          acc[type] = [];
        }
        acc[type].push(event);
        return acc;
      },
      {} as { [key: string]: Event[] },
    );

    return groupedEvents;
  }

  async findAllUpcomingEvents(): Promise<any> {
    const upcomingEvents = await this.eventRepository.find({
      where: { completed: false },
    });
    if (!upcomingEvents || upcomingEvents.length === 0) {
      throw new NotFoundException(`No upcoming events found`);
    }

    // Grouping events by type
    const groupedEvents = upcomingEvents.reduce(
      (acc, event) => {
        const type = event.type.toLowerCase();
        if (!acc[type]) {
          acc[type] = [];
        }
        acc[type].push(event);
        return acc;
      },
      {} as { [key: string]: Event[] },
    );

    return groupedEvents;
  }

  async markEventAsComplete(id: string): Promise<Event> {
    const event = await this.eventRepository.findOne({
      where: { eventId: id },
    });

    if (!event) {
      throw new NotFoundException(`No event with ${id} found`);
    }

    event.completed = true;
    await this.eventRepository.save(event);
    return event;
  }
}
